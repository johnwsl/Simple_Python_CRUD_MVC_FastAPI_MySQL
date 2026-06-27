/**
 * Frontend CRUD de Produtos — consome a API REST via fetch().
 * Arquivo carregado por index.html; init() roda automaticamente ao final.
 */

// URLs dos endpoints da API (mesmo domínio — sem CORS)
const API = {
  products: "/products/",  // CRUD de produtos
  health: "/health",       // Verificação de status da API
};

// Lista de produtos carregada do servidor (cache local em memória)
let products = [];

// Id do produto selecionado para exclusão (preenchido ao abrir modal de delete)
let deleteTargetId = null;

/** Atalho para document.querySelector — busca um elemento HTML pelo seletor CSS. */
const $ = (sel) => document.querySelector(sel);

// Referências aos elementos HTML usados pelo JavaScript (evita repetir querySelector)
const els = {
  body: $("#products-body"),               // Corpo da tabela de produtos
  empty: $("#empty-state"),                // Mensagem "nenhum produto"
  tableWrap: $(".table-wrap"),             // Container da tabela
  search: $("#search-input"),              // Campo de busca
  statCount: $("#stat-count"),             // Card: total de produtos
  statQuantity: $("#stat-quantity"),       // Card: itens em estoque
  statValue: $("#stat-value"),             // Card: valor total do estoque
  modal: $("#product-modal"),              // Modal criar/editar
  deleteModal: $("#delete-modal"),         // Modal confirmar exclusão
  form: $("#product-form"),                // Formulário do modal
  modalTitle: $("#modal-title"),           // Título do modal ("Novo" ou "Editar")
  productId: $("#product-id"),             // Campo oculto com id (vazio = criar)
  productName: $("#product-name"),         // Input nome
  productDescription: $("#product-description"),
  productPrice: $("#product-price"),
  productQuantity: $("#product-quantity"),
  deleteProductName: $("#delete-product-name"),  // Nome exibido no modal de delete
  toastContainer: $("#toast-container"),   // Área de notificações
  apiStatus: $("#api-status"),             // Bolinha verde/vermelha na sidebar
  apiStatusText: $("#api-status-text"),    // Texto "API online/offline"
};

/** Formata número como moeda brasileira (R$ 1.234,56). */
function formatCurrency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Formata data ISO (2026-06-26T08:09:09) para exibição pt-BR. */
function formatDate(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Exibe notificação temporária (toast) no canto da tela.
 * @param {string} message - Texto da mensagem
 * @param {string} type - "success" ou "error"
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  els.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/**
 * Wrapper central para chamadas HTTP à API.
 * Usa fetch nativo; trata erros e converte JSON automaticamente.
 * @param {string} url - Endpoint (ex.: "/products/")
 * @param {object} options - Opções do fetch (method, body, headers...)
 * @returns {Promise<object|null>} JSON parseado ou null se status 204
 */
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

  if (response.status === 204) return null;  // DELETE bem-sucedido
  return response.json();
}

/**
 * Atualiza os cards de estatísticas no topo da página.
 * @param {Array} list - Lista completa de produtos
 */
function updateStats(list) {
  els.statCount.textContent = list.length;
  const totalQty = list.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = list.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);
  els.statQuantity.textContent = totalQty.toLocaleString("pt-BR");
  els.statValue.textContent = formatCurrency(totalValue);
}

/** Filtra produtos pelo termo digitado na busca (sem chamar a API). */
function getFilteredProducts() {
  const term = els.search.value.trim().toLowerCase();
  if (!term) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
  );
}

/** Renderiza linhas da tabela HTML a partir do array products. */
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

/** Escapa caracteres HTML para evitar XSS ao inserir dados na tabela. */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** GET /products/ — carrega produtos da API e atualiza a tabela. */
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

/** GET /health — verifica se a API está online e atualiza indicador na sidebar. */
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

/** Abre modal vazio para criar novo produto (sem chamada à API). */
function openCreateModal() {
  els.modalTitle.textContent = "Novo produto";
  els.productId.value = "";
  els.form.reset();
  els.modal.showModal();
  els.productName.focus();
}

/**
 * Abre modal preenchido para editar produto existente.
 * Usa dados do array local — não chama GET /products/{id}.
 */
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

/** Fecha o modal de criar/editar. */
function closeModal() {
  els.modal.close();
}

/** Abre modal de confirmação antes de excluir. */
function openDeleteModal(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  deleteTargetId = id;
  els.deleteProductName.textContent = product.name;
  els.deleteModal.showModal();
}

/** Fecha modal de exclusão e limpa deleteTargetId. */
function closeDeleteModal() {
  deleteTargetId = null;
  els.deleteModal.close();
}

/**
 * Envia formulário — POST (criar) ou PUT (editar) conforme product-id.
 * Após sucesso, recarrega a lista com loadProducts().
 */
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
      // Edição — PUT /products/{id}
      await apiRequest(`${API.products}${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Produto atualizado com sucesso!");
    } else {
      // Criação — POST /products/
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

/** DELETE /products/{id} — exclui produto após confirmação no modal. */
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

/** Conecta cliques e eventos de formulário às funções correspondentes. */
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

  // Delegação de eventos: captura cliques em Editar/Excluir na tabela
  els.body.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-edit");
    const deleteBtn = e.target.closest(".btn-delete");
    if (editBtn) openEditModal(Number(editBtn.dataset.id));
    if (deleteBtn) openDeleteModal(Number(deleteBtn.dataset.id));
  });
}

/** Inicialização — executada ao carregar a página. */
async function init() {
  bindEvents();
  await checkHealth();
  await loadProducts();
}

init();
