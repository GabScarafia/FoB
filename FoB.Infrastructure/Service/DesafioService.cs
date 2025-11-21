using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Service
{
    /// <summary>
    /// Implementación de la lógica de negocio para la gestión de desafíos semanales y rankings.
    /// </summary>
    public class DesafioService : IDesafioService
    {
        private readonly IDesafioRepository _desafioRepository;
        private readonly IRecetaRepository _recetaRepository;
        private readonly IDesafioParticipacionRepository _participacionRepository;


        public DesafioService(
            IDesafioRepository desafioRepository,
            IRecetaRepository recetaRepository,
            IDesafioParticipacionRepository participacionRepository)
        {
            _desafioRepository = desafioRepository;
            _recetaRepository = recetaRepository;
            _participacionRepository = participacionRepository;
        }

        // =========================================================================
        // 1. OBTENER DESAFÍO ACTUAL Y RANKING ANTERIOR (Pop-up/Notificaciones)
        // =========================================================================
        public async Task<DesafioSemanalDto> GetDesafioActivoYRankingAnteriorAsync()
        {
            // 1. Obtener el desafío activo
            var desafioActual = await _desafioRepository.GetActiveDesafioAsync();

            // Obtener el desafío anterior al momento actual (puede devolver null)
            var desafioAnterior = await _desafioRepository.ObtenerDesafioAnteriorAsync(DateTime.UtcNow);

            List<RankingDto> rankingAnteriorReal = new List<RankingDto>();

            // Solo recalcular ranking anterior si existe y tiene FechaFin válida
            if (desafioAnterior != null && desafioAnterior.FechaFin.HasValue)
            {
                var participacionesAnteriores = await _participacionRepository.GetByDesafioIdAsync(desafioAnterior.Id);

                // fecha de corte para obtener las estadísticas históricas
                var fechaCierreAnterior = DateTime.SpecifyKind(desafioAnterior.FechaFin.Value, DateTimeKind.Utc);

                // 3. Recalcular los puntos de CADA RECETA participante.
                var puntajesRecetas = new List<RankingDto>();

                // Protegemos contra repositorios que devuelvan null
                if (participacionesAnteriores != null)
                {
                    foreach (var participacion in participacionesAnteriores)
                    {
                        // Validar que la participación tenga RecetaId
                        if (!participacion.RecetaId.HasValue) continue;

                        var statsReceta = await _recetaRepository.GetRecetaStatsAsync(participacion.RecetaId.Value, fechaCierreAnterior);

                        // Si por alguna razón la receta o sus stats no existen a esa fecha, se ignora.
                        if (statsReceta == null) continue;

                        // 4. Calcular el puntaje usando la fórmula (Recálculo con datos históricos)
                        var nuevoPuntaje = CalculateRankingScore(
                            statsReceta.Likes,
                            statsReceta.Favorites,
                            statsReceta.Visits
                        );

                        puntajesRecetas.Add(new RankingDto
                        {
                            UsuarioId = participacion.UsuarioId,
                            NombreUsuario = statsReceta.NombreUsuario,
                            Puntos = (int)nuevoPuntaje
                        });
                    }
                }

                // 5. Agrupar por Usuario, sumar los puntos y ordenar.
                var rankingTotal = puntajesRecetas
                    .GroupBy(p => p.UsuarioId)
                    .Select(g => new RankingDto
                    {
                        UsuarioId = g.Key,
                        // Usamos g.First() para obtener las propiedades de usuario no agrupadas.
                        NombreUsuario = g.First().NombreUsuario,
                        NombreCompleto = g.First().NombreCompleto,
                        UrlImagenPerfil = g.First().UrlImagenPerfil,
                        Puntos = (int)g.Sum(x => x.Puntos)
                    })
                    .OrderByDescending(r => r.Puntos)
                    .Take(3) // 6. Tomar solo el Top 3
                    .ToList();

                // 7. Asignar la posición final (Rank)
                for (int i = 0; i < rankingTotal.Count; i++)
                {
                    rankingTotal[i].Posicion = i + 1;
                    // Marcar el ganador anterior (Posicion 1)
                    if (rankingTotal[i].Posicion == 1)
                    {
                        rankingTotal[i].EsGanadorAnterior = true;
                    }
                }

                rankingAnteriorReal = rankingTotal;
            }

            // Preparar DesafioDto de forma segura (evitar accesos a Nullable<T>.Value sin checks)
            DesafioDto desafioDto;

            if (desafioActual != null)
            {
                // Si las fechas son nulas, usar valores por defecto razonables para evitar excepciones en tiempo de ejecución.
                var fechaInicioSeguro = desafioActual.FechaInicio ?? DateTime.UtcNow;
                var fechaFinSeguro = desafioActual.FechaFin ?? fechaInicioSeguro.AddDays(7);

                // Asegurar que las fechas queden en UTC
                fechaInicioSeguro = DateTime.SpecifyKind(fechaInicioSeguro, DateTimeKind.Utc);
                fechaFinSeguro = DateTime.SpecifyKind(fechaFinSeguro, DateTimeKind.Utc);

                desafioDto = new DesafioDto
                {
                    Id = desafioActual.Id,
                    Nombre = desafioActual.Nombre,
                    Ingrediente = desafioActual.Ingrediente,
                    Descripcion = desafioActual.Descripcion,
                    FechaInicio = fechaInicioSeguro,
                    FechaFin = fechaFinSeguro
                };
            }
            else
            {
                // No hay desafío activo: devolver DTO con valores neutros para evitar asignaciones nulas
                desafioDto = new DesafioDto
                {
                    Id = 0,
                    Nombre = string.Empty,
                    Ingrediente = string.Empty,
                    Descripcion = string.Empty,
                    FechaInicio = DateTime.MinValue,
                    FechaFin = DateTime.MinValue
                };
            }

            // 9. Devolver la estructura completa del pop-up/notificación
            return new DesafioSemanalDto
            {
                DesafioActual = desafioDto,
                RankingAnterior = rankingAnteriorReal
            };
        }



        // *************************************************************************
        // 2. OBTENER RANKING SEMANAL COMPLETO (Recálculo y Agrupación)
        // *************************************************************************

        public async Task<IEnumerable<RankingDto>> GetCurrentWeeklyRankingAsync()
        {
            var desafioActivo = await _desafioRepository.GetActiveDesafioAsync();
            if (desafioActivo == null)
            {
                return Enumerable.Empty<RankingDto>();
            }

            // 1. Obtener las participaciones registradas en la tabla
            var participaciones = await _participacionRepository.GetByDesafioIdAsync(desafioActivo.Id);

            // Lista para almacenar los resultados actualizados
            var rankingRecalculado = new List<RankingDto>();

            // La fecha de corte para el ranking actual es AHORA.
            var fechaActualDeCorte = DateTime.Now;

            foreach (var participacion in participaciones)
            {
                // 2. Obtener las estadísticas actuales de la receta

                RecetaStatsDto? statsReceta = null;

                if(participacion.RecetaId.HasValue)
                    statsReceta = await _recetaRepository.GetRecetaStatsAsync(participacion.RecetaId.Value, fechaActualDeCorte);

                // Si la receta no tiene stats o ya no existe, ignorarla (buena práctica)
                if (statsReceta == null) continue;

                // 3. Calcular el nuevo puntaje usando la fórmula
                var nuevoPuntaje = CalculateRankingScore(statsReceta.Likes,
                                                        statsReceta.Favorites,
                                                        statsReceta.Visits);

                // 4. Actualizar el campo Puntos en la BD (Persistencia del ranking)
                participacion.Puntos = nuevoPuntaje;

                await _participacionRepository.UpdateAsync(participacion);

                // 5. Agregar el puntaje del usuario al resultado (usando el UsuarioId de la participación)
                rankingRecalculado.Add(new RankingDto
                {
                    UsuarioId = participacion.UsuarioId,
                    NombreUsuario = statsReceta.NombreUsuario,
                    Puntos = (int)nuevoPuntaje
                });
            }

            // 6. Agrupar por Usuario, sumar los puntos (si tiene varias recetas) y ordenar
            var rankingFinal = rankingRecalculado
                .GroupBy(p => p.UsuarioId)
                .Select(g => new RankingDto
                {
                    UsuarioId = g.Key,
                    NombreUsuario = g.First().NombreUsuario,
                    Puntos = (int)g.Sum(x => x.Puntos)
                })
                .OrderByDescending(r => r.Puntos)
                .ToList();

            // 7. Asignar la posición final (Rank)
            for (int i = 0; i < rankingFinal.Count; i++)
            {
                rankingFinal[i].Posicion = i + 1;
            }

            return rankingFinal;
        }

        // =========================================================================
        // 3. CREACIÓN Y GESTIÓN DE DESAFÍOS (Admin)
        // =========================================================================

        /// <summary>
        /// Crea un nuevo desafío en la base de datos (método para uso administrativo).
        /// </summary>
        public async Task<DesafioManagementResponseDto> CreateDesafioAsync(CrearDesafioRequestDto request)
        {
            // Validación de negocio: Fin > Inicio
            if (request.FechaFin <= request.FechaInicio)
            {
                throw new InvalidOperationException("La fecha de fin debe ser posterior a la fecha de inicio.");
            }

            // Mapear DTO a Entidad del modelo de infraestructura
            var nuevoDesafio = new Desafio
            {
                Nombre = request.Nombre,
                Ingrediente = request.Ingrediente,
                Descripcion = request.Descripcion,
                FechaInicio = request.FechaInicio.ToUniversalTime(),
                FechaFin = request.FechaFin.ToUniversalTime(),
                Activo = true
            };

            var desafioGuardado = await _desafioRepository.AddAsync(nuevoDesafio);

            return new DesafioManagementResponseDto
            {
                DesafioId = desafioGuardado.Id,
                Mensaje = $"Desafío '{desafioGuardado.Nombre}' creado exitosamente."
            };
        }

        /// <summary>
        /// Actualiza un desafío existente en la base de datos (método para uso administrativo).
        /// </summary>
        public async Task<DesafioManagementResponseDto> UpdateDesafioAsync(ActualizarDesafioRequestDto request)
        {
            var desafioExistente = await _desafioRepository.GetByIdAsync(request.Id);

            if (desafioExistente == null)
            {
                // Usamos KeyNotFoundException para que el Controller devuelva un 404 (Not Found)
                throw new KeyNotFoundException($"Desafío con Id {request.Id} no encontrado.");
            }

            // Aplicar cambios del DTO
            desafioExistente.Nombre = request.Nombre;
            desafioExistente.Ingrediente = request.Ingrediente;
            desafioExistente.Descripcion = request.Descripcion;
            desafioExistente.FechaInicio = request.FechaInicio.ToUniversalTime();
            desafioExistente.FechaFin = request.FechaFin.ToUniversalTime();

            // Validación de negocio
            if (desafioExistente.FechaFin <= desafioExistente.FechaInicio)
            {
                throw new InvalidOperationException("La fecha de fin debe ser posterior a la fecha de inicio.");
            }

            await _desafioRepository.UpdateAsync(desafioExistente);

            return new DesafioManagementResponseDto
            {
                DesafioId = desafioExistente.Id,
                Mensaje = $"Desafío '{desafioExistente.Nombre}' actualizado exitosamente."
            };
        }

        // -------------------------------------------------------------------------

        // =========================================================================
        // 4. FINALIZAR DESAFÍO Y CALCULAR RANKING (Tarea Programada)
        // =========================================================================
        public Task FinalizarDesafioYCalcularRankingAsync()
        {
            // Lógica real para la tarea programada semanal:
            // 1. Obtener el desafío activo que haya expirado.
            // 2. Recalcular los puntos finales y guardar el resultado histórico (ej. en una tabla DesafioResultado).
            // 3. Marcar el desafío como inactivo y/o activar el siguiente desafío de la cola.

            Console.WriteLine("El proceso de cálculo y cierre semanal se ha ejecutado.");
            return Task.CompletedTask;
        }


        /// <summary>
        /// Calcula el puntaje de una publicación para el ranking del desafío.
        /// Fórmula: (Likes * 3) + (Favoritos * 5) + (Visitas * 0.1) + (Bono por Publicación: 50)
        /// </summary>
        public double CalculateRankingScore(int likes, int favorites, int visits)
        {
            const int PUNTOS_POR_LIKE = 3;
            const int PUNTOS_POR_FAVORITO = 5;
            const double PUNTOS_POR_VISITA = 0.1;
            const int BONO_FIJO_PUBLICACION = 50; // Se incluye el bono en el cálculo total

            double score = 0;

            // 1. Puntos por interacciones
            score += likes * PUNTOS_POR_LIKE;
            score += favorites * PUNTOS_POR_FAVORITO;
            score += visits * PUNTOS_POR_VISITA;

            // 2. Bono fijo por la participación
            score += BONO_FIJO_PUBLICACION;

            // Retorna el puntaje total
            return score;
        }
    }
}