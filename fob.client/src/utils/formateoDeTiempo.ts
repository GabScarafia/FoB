// src/utils/formatoTiempo.ts

/**
 * Convierte una fecha (string ISO 8601 o objeto Date) a un formato de tiempo relativo
 * usando una lógica universal basada en milisegundos desde el epoch.
 * @param fechaEntrada La cadena de fecha o el objeto Date.
 * @returns El tiempo relativo formateado.
 */


/** para el flaquito q vea esto, soy maty russo, esto supuestamente deberia traer la hora en q se creo el comentario, 
 * transformala en segundos y restarsela a la hora actual en segundos, despues dividirlo en intervalos para mostrar
 * el tipico de "hace 5 minutos", "hace 2 horas", "hace 3 dias", etc. No anda hasta donde yo se xq no me anda a mi jaja, na mentira
 * eso me lo autocompleto el vs code y me causo gracia xdxd. Supuestamente no anda xq la hora que trae la api esta adelantada 3 horas, 
 * pero no se como arreglarlo, y como se le resta la hora actual te da una hora negativa que se muestra como hace 0 segundos.
 * 
 * si alguno tiene una idea de como arreglarlo, se agradece.
 */
export const formatoTiempoRelativo = (fechaEntrada: Date): string => {
    let fecha: Date;

    console.log("fecha entrada",fechaEntrada)
    console.log("tipo", typeof(fechaEntrada))
    // Si la entrada ya es un objeto Date, la usa directamente
    if (fechaEntrada instanceof Date) {
        fecha = fechaEntrada;
    } else {
        fecha = new Date(fechaEntrada);
        // // Analiza la cadena ISO 8601 de forma robusta
        // const partes = fechaEntrada.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/);
        // if (partes) {
        //     // Usa Date.UTC para que la fecha siempre se base en el huso horario universal (UTC)
        //     fecha = new Date(Date.UTC(+partes[1], +partes[2] - 1, +partes[3], +partes[4], +partes[5], +partes[6], +partes[7]));
        // } else {
        //     // Reserva para formatos no estándar
        //     fecha = new Date(fechaEntrada);
        // }
    }

    // Si la fecha no es válida, devolvemos un mensaje de error
    if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
    }

    const ahoraMilisegundos = Date.now();
    const fechaMilisegundos = fecha.getTime();
    
    // Calcula la diferencia en segundos
    const segundos = Math.floor((ahoraMilisegundos - fechaMilisegundos) / 1000);

    let intervalo = segundos / 31536000;
    if (intervalo > 1) {
        return `hace ${Math.floor(intervalo)} año${Math.floor(intervalo) > 1 ? 's' : ''}`;
    }
    intervalo = segundos / 2592000;
    if (intervalo > 1) {
        return `hace ${Math.floor(intervalo)} mes${Math.floor(intervalo) > 1 ? 'es' : ''}`;
    }
    intervalo = segundos / 86400;
    if (intervalo > 1) {
        return `hace ${Math.floor(intervalo)} día${Math.floor(intervalo) > 1 ? 's' : ''}`;
    }
    intervalo = segundos / 3600;
    if (intervalo > 1) {
        return `hace ${Math.floor(intervalo)} hora${Math.floor(intervalo) > 1 ? 's' : ''}`;
    }
    intervalo = segundos / 60;
    if (intervalo > 1) {
        return `hace ${Math.floor(intervalo)} minuto${Math.floor(intervalo) > 1 ? 's' : ''}`;
    }

    return `hace ${Math.floor(segundos)} segundo${Math.floor(segundos) !== 1 ? 's' : ''}`;
};