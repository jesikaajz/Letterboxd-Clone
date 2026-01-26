// view/pagination.js
import { Utils } from '../utils/utils.js';

export function renderPagination(currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) return null;
  
  const container = Utils.createElement('div', 'pagination-container d-flex justify-content-center align-items-center gap-3 mt-4');
  
  // Botón anterior
  const prevBtn = Utils.createElement('button', 'btn btn-outline-light btn-sm', '← Previous');
  if (currentPage === 1) {
    prevBtn.disabled = true;
    prevBtn.classList.add('disabled');
  } else {
    prevBtn.onclick = () => onPageChange(currentPage - 1);
  }
  
  // Información de página
  const pageInfo = Utils.createElement('span', 'text-white small', 
    `Page ${currentPage} of ${totalPages}`
  );
  
  // Botón siguiente
  const nextBtn = Utils.createElement('button', 'btn btn-outline-light btn-sm', 'Next →');
  if (currentPage === totalPages) {
    nextBtn.disabled = true;
    nextBtn.classList.add('disabled');
  } else {
    nextBtn.onclick = () => onPageChange(currentPage + 1);
  }
  
  // Selector de página
  const pageSelect = Utils.createElement('div', 'd-flex align-items-center gap-2');
  const pageInput = Utils.createElement('input', 'form-control form-control-sm bg-dark text-white border-secondary');
  pageInput.type = 'number';
  pageInput.min = 1;
  pageInput.max = totalPages;
  pageInput.value = currentPage;
  pageInput.style.width = '70px';
  pageInput.placeholder = `Page`;
  
  const goBtn = Utils.createElement('button', 'btn btn-primary btn-sm', 'Go');
  goBtn.onclick = () => {
    const page = parseInt(pageInput.value);
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };
  
  pageSelect.appendChild(pageInput);
  pageSelect.appendChild(goBtn);
  
  container.appendChild(prevBtn);
  container.appendChild(pageInfo);
  container.appendChild(pageSelect);
  container.appendChild(nextBtn);
  
  return container;
}