'use strict'

export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
}

//type is 'success' or 'error'
export const showAlert = (type, msg) => {
    hideAlert(); // Remove existing alerts before showing a new one
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(hideAlert, 5000); // Remove alert after 5 seconds
}
