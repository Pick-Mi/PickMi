import Swal from 'sweetalert2';

export function alertSuccess(texto: string) {
    Swal.fire({
        icon: 'success',
        confirmButtonColor: '#0f93ff',
        text: texto
    });
}

export function alertError(texto: string) {
    Swal.fire({
        icon: 'error',
        confirmButtonColor: '#0f93ff',
        text: texto
    });
}

export function alertWarning(texto: string) {
    Swal.fire({
        icon: 'warning',
        confirmButtonColor: '#0f93ff',
        text: texto
    });
}