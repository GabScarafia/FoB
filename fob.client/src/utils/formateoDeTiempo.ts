// src/utils/formateoDeTiempo.ts

/**
 * Convierte una fecha (string ISO 8601 o objeto Date) a un formato de tiempo relativo
 * usando una lógica universal basada en milisegundos desde el epoch.
 * @param fechaEntrada La cadena de fecha o el objeto Date.
 * @returns El tiempo relativo formateado.
 */
export const formatoTiempoRelativo = (fechaEntrada: Date | string): string => {
    let fecha: Date;
    
    // Si la entrada es un string, la convierte a un objeto Date
    if (typeof fechaEntrada === 'string') {
        fecha = new Date(fechaEntrada);
    } else {
        // Si ya es un objeto Date, la usa directamente
        fecha = fechaEntrada;
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