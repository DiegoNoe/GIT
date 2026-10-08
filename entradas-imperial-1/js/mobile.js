/* Capa móvil: el código comercial y sus destinos se conservan. */
(function(){
 document.querySelectorAll('.first-row>.interface-button').forEach(button=>{const label=button.getAttribute('data-label');button.setAttribute('aria-label',label);button.title=label;const span=document.createElement('span');span.className='mobile-caption';span.textContent=label;button.appendChild(span);});
 $('#quantityInput').attr({'inputmode':'decimal','aria-label':'Cantidad'});$('#inputName').attr('aria-label','Nombre o código de nota');$('#inputNameWhatsapp').attr({'inputmode':'tel','aria-label':'WhatsApp'});$('#inputSearch').attr('aria-label','Clave o descripción');
 // Teclados móviles y pegado pueden emitir input sin keyup útil.
 $(document).on('input','#inputSearch,#inputName,.product-price,.product-notes,.product-quantity input',function(){ $(this).triggerHandler($.Event('keyup',{keyCode:0})); });
 function labelsForRows(){document.querySelectorAll('.product-row').forEach(row=>{row.querySelectorAll('input').forEach((input,i)=>{input.setAttribute('aria-label',['Cantidad del producto','Costo del producto','Notas del producto'][i]||'Valor');if(i<2)input.setAttribute('inputmode','decimal');});const b=row.querySelector('.remove-button');if(b)b.setAttribute('aria-label','Quitar producto');});}
 new MutationObserver(labelsForRows).observe(document.getElementById('dynamic-list'),{childList:true});
})();
let mobilePDFUrl=null;
function mobilePresentPDF(doc){
 const blob=doc.output('blob');
 if(mobilePDFUrl)URL.revokeObjectURL(mobilePDFUrl);
 mobilePDFUrl=URL.createObjectURL(blob);
 window.open(mobilePDFUrl,'_blank');
 return true;
}
