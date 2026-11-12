/* Diğer Reynas sitelerinin adresleri. Siteler ayrı alan adlarına taşınınca yalnızca bu satırı değiştirin,
   örn. label:'https://label.reynas.com/'. Üç sitedeki sites.js dosyası aynı olmalı. */
window.REYNAS_SITES={label:'../label/',accessories:'../accessories/',retail:'../retail/',portal:'../label/portal/'};
document.querySelectorAll('[data-site]').forEach(a=>{const u=window.REYNAS_SITES[a.dataset.site];if(u)a.href=u});
