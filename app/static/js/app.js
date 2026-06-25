const API = {
  products: "/products/",
  health: "/health",
};

let products = [];
let deleteTargetId = null;

const $ = (sel) => document.querySelector(sel);

const els = {
  body: $("#products-body"),
  empty: $("#empty-state"),
  tableWrap: $(".table-wrap"),
  search: $("#search-input"),
  statCount: $("#stat-count"),
  statQuantity: $("#stat-quantity"),
  statValue: $("#stat-value"),
  modal: $("#product-modal"),
  deleteModal: $("#delete-modal"),
  form: $("#product-form"),
  modalTitle: $("#modal-title"),
  productId: $("#product-id"),
  productName: $("#product-name"),
  productDescription: $("#product-description"),
  productPrice: $("#product-price"),
  productQuantity: $("#product-quantity"),
  deleteProductName: $("#delete-product-name"),
  toastContainer: $("#toast-container"),
  apiStatus: $("#api-status"),
  apiStatusText: $("#api-status-text"),
};

function formatCurrency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  els.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    let detail = "Erro na requisição.";
    try {
      const data = await response.json();
      detail = data.detail || detail;
      if (Array.isArray(detail)) {
        detail = detail.map((e) => e.msg).join(", ");
      }
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

function updateStats(list) {
  els.statCount.textContent = list.length;
  const totalQty = list.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = list.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);
  els.statQuantity.textContent = totalQty.toLocaleString("pt-BR");
  els.statValue.textContent = formatCurrency(totalValue);
}

function getFilteredProducts() {
  const term = els.search.value.trim().toLowerCase();
  if (!term) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
  );
}

function renderProducts() {
  const list = getFilteredProducts();
  updateStats(products);

  if (products.length === 0) {
    els.empty.classList.remove("hidden");
    els.tableWrap.classList.add("hidden");
    els.body.innerHTML = "";
    return;
  }

  els.empty.classList.add("hidden");
  els.tableWrap.classList.remove("hidden");

  if (list.length === 0) {
    els.body.innerHTML = `<tr class="loading-row"><td colspan="7">Nenhum produto encontrado para "${els.search.value}".</td></tr>`;
    return;
  }

  els.body.innerHTML = list
    .map(
      (p) => `
    <tr data-id="${p.id}">
      <td>#${p.id}</td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td class="desc-cell">${escapeHtml(p.description || "—")}</td>
      <td class="price-cell">${formatCurrency(p.price)}</td>
      <td>${p.quantity}</td>
      <td class="date-cell">${formatDate(p.updated_at)}</td>
      <td>
        <div class="actions">
          <button type="button" class="btn btn-ghost btn-sm btn-edit" data-id="${p.id}">Editar</button>
          <button type="button" class="btn btn-danger btn-sm btn-delete" data-id="${p.id}">Excluir</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadProducts() {
  els.body.innerHTML = `<tr class="loading-row"><td colspan="7">Carregando produtos...</td></tr>`;
  try {
    products = await apiRequest(API.products);
    renderProducts();
  } catch (err) {
    els.body.innerHTML = `<tr class="loading-row"><td colspan="7">Erro ao carregar: ${escapeHtml(err.message)}</td></tr>`;
    showToast(err.message, "error");
  }
}

async function checkHealth() {
  try {
    const data = await apiRequest(API.health);
    els.apiStatus.className = "status-dot online";
    els.apiStatusText.textContent = data.message || "API online";
  } catch {
    els.apiStatus.className = "status-dot offline";
    els.apiStatusText.textContent = "API offline";
  }
}

function openCreateModal() {
  els.modalTitle.textContent = "Novo produto";
  els.productId.value = "";
  els.form.reset();
  els.modal.showModal();
  els.productName.focus();
}

function openEditModal(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  els.modalTitle.textContent = "Editar produto";
  els.productId.value = product.id;
  els.productName.value = product.name;
  els.productDescription.value = product.description || "";
  els.productPrice.value = product.price;
  els.productQuantity.value = product.quantity;
  els.modal.showModal();
  els.productName.focus();
}

function closeModal() {
  els.modal.close();
}

function openDeleteModal(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  deleteTargetId = id;
  els.deleteProductName.textContent = product.name;
  els.deleteModal.showModal();
}

function closeDeleteModal() {
  deleteTargetId = null;
  els.deleteModal.close();
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    name: els.productName.value.trim(),
    description: els.productDescription.value.trim() || null,
    price: parseFloat(els.productPrice.value),
    quantity: parseInt(els.productQuantity.value, 10),
  };

  const id = els.productId.value;

  try {
    const saveBtn = $("#btn-save");
    saveBtn.disabled = true;
    saveBtn.textContent = "Salvando...";

    if (id) {
      await apiRequest(`${API.products}${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Produto atualizado com sucesso!");
    } else {
      await apiRequest(API.products, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Produto criado com sucesso!");
    }

    closeModal();
    await loadProducts();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    const saveBtn = $("#btn-save");
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar";
  }
}

async function handleDelete() {
  if (!deleteTargetId) return;

  try {
    await apiRequest(`${API.products}${deleteTargetId}`, { method: "DELETE" });
    showToast("Produto excluído com sucesso!");
    closeDeleteModal();
    await loadProducts();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function bindEvents() {
  $("#btn-new").addEventListener("click", openCreateModal);
  $("#btn-refresh").addEventListener("click", loadProducts);
  $("#btn-close-modal").addEventListener("click", closeModal);
  $("#btn-cancel").addEventListener("click", closeModal);
  $("#btn-close-delete").addEventListener("click", closeDeleteModal);
  $("#btn-cancel-delete").addEventListener("click", closeDeleteModal);
  $("#btn-confirm-delete").addEventListener("click", handleDelete);

  els.form.addEventListener("submit", handleSubmit);
  els.search.addEventListener("input", renderProducts);

  els.body.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-edit");
    const deleteBtn = e.target.closest(".btn-delete");
    if (editBtn) openEditModal(Number(editBtn.dataset.id));
    if (deleteBtn) openDeleteModal(Number(deleteBtn.dataset.id));
  });
}

async function init() {
  bindEvents();
  await checkHealth();
  await loadProducts();
}

init();
