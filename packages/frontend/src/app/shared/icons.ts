import { html } from 'lit';
import { svg } from 'lit-html';

/**
 * @see https://icons.getbootstrap.com/
 */
export const icons = {
  facebook: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-facebook" viewBox="0 0 16 16">
  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
</svg>`,
  cardChecklist: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-card-checklist" viewBox="0 0 16 16">
  <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"/>
  <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0M7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0"/>
</svg>`,
  journal: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journal" viewBox="0 0 16 16">
  <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/>
  <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/>
</svg>`,
  newspaper: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-newspaper" viewBox="0 0 16 16">
  <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v10.528c0 .3-.05.654-.238.972h.738a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 1 1 0v9a1.5 1.5 0 0 1-1.5 1.5H1.497A1.497 1.497 0 0 1 0 13.5zM12 14c.37 0 .654-.211.853-.441.092-.106.147-.279.147-.531V2.5a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5v11c0 .278.223.5.497.5z"/>
  <path d="M2 3h10v2H2zm0 3h4v3H2zm0 4h4v1H2zm0 2h4v1H2zm5-6h2v1H7zm3 0h2v1h-2zM7 8h2v1H7zm3 0h2v1h-2zm-3 2h2v1H7zm3 0h2v1h-2zm-3 2h2v1H7zm3 0h2v1h-2z"/>
</svg>`,
  globe: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe" viewBox="0 0 16 16">
  <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472M3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/>
</svg>`,
  personPlus: svg`<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-person-plus" viewBox="0 0 16 16">
  <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
  <path fill-rule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z"/>
  </svg>`,
  pencil: svg`<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
  </svg>`,
  phone: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-phone" viewBox="0 0 16 16">
  <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
  <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg>`,
  search: svg`<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg>`,
  calenderPlus: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-plus" viewBox="0 0 16 16">
  <path d="M8 7a.5.5 0 0 1 .5.5V9H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V10H6a.5.5 0 0 1 0-1h1.5V7.5A.5.5 0 0 1 8 7z"/>
  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
</svg>`,
  checkCircle: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
</svg>`,
  clipboardCheck: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
</svg>`,
  exclamationCircle: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
</svg>`,
  exclamationTriangleFill: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
</svg>`,
  journalPlus: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journal-plus" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5z"/>
<path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
<path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
</svg>`,
  nodePlus: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-node-plus" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M11 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM6.025 7.5a5 5 0 1 1 0 1H4A1.5 1.5 0 0 1 2.5 10h-1A1.5 1.5 0 0 1 0 8.5v-1A1.5 1.5 0 0 1 1.5 6h1A1.5 1.5 0 0 1 4 7.5h2.025zM11 5a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2A.5.5 0 0 1 11 5zM1.5 7a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/>
</svg>`,
  pencilSquare: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
<path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
<path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
</svg>`,
  eye: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
</svg>`,
  download: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
</svg>`,
  calendar: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar" viewBox="0 0 16 16">
<path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
</svg>`,
  envelope: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope" viewBox="0 0 16 16">
<path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
</svg>`,
  mailbox: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mailbox" viewBox="0 0 16 16">
<path d="M4 4a3 3 0 0 0-3 3v6h6V7a3 3 0 0 0-3-3zm0-1h8a4 4 0 0 1 4 4v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V7a4 4 0 0 1 4-4zm2.646 1A3.99 3.99 0 0 1 8 7v6h7V7a3 3 0 0 0-3-3H6.646z"/>
<path d="M11.793 8.5H9v-1h5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.354-.146l-.853-.854zM5 7c0 .552-.448 0-1 0s-1 .552-1 0a1 1 0 0 1 2 0z"/>
</svg>`,
  camera: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera" viewBox="0 0 16 16">
  <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/>
  <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
</svg>`,
  hourglass: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hourglass" viewBox="0 0 16 16">
<path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5zm2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256 1.011.791 1.011 1.491v.702c0 .7-.478 1.235-1.011 1.491A3.5 3.5 0 0 0 4.5 13v1h7v-1a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351v-.702c0-.7.478-1.235 1.011-1.491A3.5 3.5 0 0 0 11.5 3V2h-7z"/>
</svg>`,
  arrowUpSquare: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-square" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.5 9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/>
</svg>`,
  person: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z"/>
</svg>`,
  personSlash: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-slash" viewBox="0 0 16 16">
  <path d="M13.879 10.414a2.501 2.501 0 0 0-3.465 3.465l3.465-3.465Zm.707.707-3.465 3.465a2.501 2.501 0 0 0 3.465-3.465Zm-4.56-1.096a3.5 3.5 0 1 1 4.949 4.95 3.5 3.5 0 0 1-4.95-4.95ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm.256 7a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Z"/>
</svg>`,
  personLock: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-lock" viewBox="0 0 16 16">
  <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 5.996V14H3s-1 0-1-1 1-4 6-4c.564 0 1.077.038 1.544.107a4.524 4.524 0 0 0-.803.918A10.46 10.46 0 0 0 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h5ZM9 13a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2Zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1Z"/>
</svg>`,
  telephone: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-telephone" viewBox="0 0 16 16">
  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
</svg>`,
  unlock: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-unlock" viewBox="0 0 16 16">
  <path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 2 0 0 0-2-2zM3 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H3z"/>
</svg>`,
  lock: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lock" viewBox="0 0 16 16">
  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>
</svg>`,
  trash: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
<path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
</svg>`,
  cashCoin: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cash-coin" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/>
<path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1h-.003zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195l.054.012z"/>
<path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083c.058-.344.145-.678.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1H1z"/>
<path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 5.982 5.982 0 0 1 3.13-1.567z"/>
</svg>`,
  cameraVideoOff: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-off" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l.714 1H9.5a1 1 0 0 1 1 1v6a1 1 0 0 1-.144.518l.605.847zM1.428 4.18A.999.999 0 0 0 1 5v6a1 1 0 0 0 1 1h5.014l.714 1H2a2 2 0 0 1-2-2V5c0-.675.334-1.272.847-1.634l.58.814zM15 11.73l-3.5-1.555v-4.35L15 4.269v7.462zm-4.407 3.56-10-14 .814-.58 10 14-.814.58z"/>
</svg>`,
  caretDownFill: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16">
  <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
</svg>`,
  caretUpFill: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-up-fill" viewBox="0 0 16 16">
  <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/>
</svg>`,
  genderFemale: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gender-female" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 5a5 5 0 1 1 5.5 4.975V12h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0V13h-2a.5.5 0 0 1 0-1h2V9.975A5 5 0 0 1 3 5z"/>
</svg>`,
  genderMale: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gender-male" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M9.5 2a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V2.707L9.871 6.836a5 5 0 1 1-.707-.707L13.293 2H9.5zM6 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
</svg>`,
  genderTrans: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gender-trans" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1.707L3.5 2.793l.646-.647a.5.5 0 1 1 .708.708l-.647.646.822.822A3.99 3.99 0 0 1 8 3c1.18 0 2.239.51 2.971 1.322L14.293 1H11.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-3.45 3.45A4 4 0 0 1 8.5 10.97V13H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V14H6a.5.5 0 0 1 0-1h1.5v-2.03a4 4 0 0 1-3.05-5.814l-.95-.949-.646.647a.5.5 0 1 1-.708-.708l.647-.646L1 1.707V3.5a.5.5 0 0 1-1 0v-3zm5.49 4.856a3 3 0 1 0 5.02 3.288 3 3 0 0 0-5.02-3.288z"/>
</svg>`,
  genderNeuter: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gender-neuter" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3 5a5 5 0 1 1 5.5 4.975V15.5a.5.5 0 0 1-1 0V9.975A5 5 0 0 1 3 5Z"/>
</svg>`,
  questionCircle: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-question-circle" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
  <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
</svg>`,
  printer: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-printer" viewBox="0 0 16 16">
  <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
  <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1"/>
</svg>`,
  moonStarsFill: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moon-stars-fill" viewBox="0 0 16 16">
  <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/>
  <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
</svg>`,
  sunFill: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sun-fill" viewBox="0 0 16 16">
  <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
</svg>`,
  circleHalf: svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-circle-half" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16"/>
</svg>`,
  customVegetarian: html`<img
    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA3QAAAN0BcFOiBwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQGSURBVFiFvZZZaFxlFMd/57szk07amErrQotgHwQfCiIUTZqJNQ8GG5N2EmypC0YUWgQD6SKKCFXwQUNtbCtiXfrigqSS1bRqhbFJnSZl4oNSXF4rtqXpkiaZTOYux4dJJsOQaWZGk+9lvu+cc///3z33Xs6IqlLZXt0ncLeLvjS8+0yMRVp1J+tKTGLZ22K8es8zW/sbO/8yAAglChsMMlTZHmpeDPOG7sZHremSsyK6D5X7LeNtATAA42PX60XlQOosxza2Vz/9f5gKIg094YaG7sYoEAEeTCdV7gMQVU3HNh4M7VKRjwBXRXYMtQ58U4zx9uPbrSmfswPR14D1Ocp+6gt31ZjMSHTPmaMobYAlql9Vtlc3FGq+pbtxc8Jv/4noF7cwn78DkGpbRXvoa2A7MKY+3/qhlsjfCxk3dTWtSooeEXgqT9arfeGu1SY7qqguu+lrBn4GysVxPslHzRb9tABzAAdmXsLsFdkfSdieLwyMAo9vfL/6hVspbelqqgfCBZgD2DkBAGJ7I6OovA6gKm2htlBZTinRN7JDqsrYxTFuXr6Z66rLtwQAGBof/Az4BXSVE6A1V53CvdmxydFJ7ISN53o5mOX7BQF0v3qipgVQUdlb/U717dk1Gz7e5QfuzIwlxhMkJhKIEcrumL9xnvH6FwQAiO45HQX6gXKnRPdl59esuegH0rfpJB0mr04CULa6DMtvzSd7pTQZGM4LAADh0MympebDmhWZqd763jjw6+x54soEqkqwPEhgeWA+NUfg2Y5tHW7eAGdbB38UOA+UJRLuk/OU9AMk40mcpIOxDKUrS+e/F9GXe8NdP8ye8+sA4AmHUwr6fHbOtf2Hgan49TgAwZVBxEh22biqvNi7tftoZjBvAKPu58A14JGHD2xal5k7sa3jytRYvN9JOlg+i2BZMDM9JcJxsdwHvm3sPJat68sXILo7OlV5MPQlIi3GeM3Am5n5yWvxewCMZX0Acl5Rz8CFZbZ/sGNbx0Qu3bwBAATTo2gLwnOZABWHKu4S/A8BmnS9d/saOxecHbMr70cAkFwRH1C4AayrOlyVnnTiBjYDoshQPoOraIDYzpiNchLAc0ztnIrWAQgcL0SvYICUifbMbB4DqHmrxodSC6irUvAfmIIBbDv4HalJtqnuSF3J9G1uFVAODJ/bc/rCogPEXj01BpwGgjfsiZBqqv1o4e0vCgBAkMGUp9aK8ASAiDlVjFZBn+HscoURo4DwjMJawE4un/yjGK2iOqC2NTKzXTvz+3tsZ8xeMoBzr0QuIfwzRyS/FaNTNEDKlJH03syN46UDkAwAvKXvgHhzAMZowd//fwZIGkkDTNuBS0sOEGsduAi8B0RieyOjxer8CzLDgO7xrO8oAAAAAElFTkSuQmCC"
  />`,
  customHalal: html`<img
    src="data:image/png;base64,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"
  />`,
  customFood: html`<img
    src="data:image/png;base64,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"
  />`,
};
