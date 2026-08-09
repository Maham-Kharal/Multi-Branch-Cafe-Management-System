const API_BASE = 'http://localhost:8000/api/v1';

// Global App State
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  branches: [],
  masterItems: [],
  branchMenuItems: [],
  orders: [],
  selectedBranchId: null,
  categories: ['ALL', 'Hot Coffee', 'Cold Brew', 'Bakery', 'Snacks', 'Desserts'],
  selectedCategory: 'ALL',
  cart: []
};

// Helper: API Request wrapper with Bearer token
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (response.status === 401) {
    logout();
    throw new Error('Session expired. Please login again.');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'API request failed');
  }
  return data;
}

// Auth Handlers
function checkSession() {
  if (state.token && state.user) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appLayout').style.display = 'flex';

    document.getElementById('navUserName').textContent = state.user.full_name || state.user.email;
    document.getElementById('navUserRole').textContent = state.user.role;
    document.getElementById('navUserRole').className = `user-role-tag role-${state.user.role}`;

    document.getElementById('sideTenantName').textContent = state.user.tenant_id ? 'Enterprise Active' : 'System Account';
    document.getElementById('sideUserEmail').textContent = state.user.email;

    renderSidebarNav();
    showDefaultView();
  } else {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appLayout').style.display = 'none';
  }
}

function login(tokenData) {
  state.token = tokenData.access_token;
  state.user = {
    id: tokenData.user_id,
    email: tokenData.email,
    role: tokenData.role,
    tenant_id: tokenData.tenant_id,
    branch_id: tokenData.branch_id,
    full_name: tokenData.email.split('@')[0]
  };

  localStorage.setItem('token', state.token);
  localStorage.setItem('user', JSON.stringify(state.user));
  checkSession();
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  checkSession();
}

// Dynamic Navigation per Role
function renderSidebarNav() {
  const nav = document.getElementById('sideNavMenu');
  nav.innerHTML = '';

  let links = [];
  if (state.user.role === 'CAFE_OWNER' || state.user.role === 'SUPER_ADMIN') {
    links = [
      { id: 'navOwnerDashboard', label: '📊 Dashboard', view: 'viewOwnerDashboard' },
      { id: 'navBranches', label: '🏬 Physical Branches', view: 'viewBranches' },
      { id: 'navMasterMenu', label: '📖 Master Catalog', view: 'viewMasterMenu' },
      { id: 'navBranchMenu', label: '🏷️ Location Pricing', view: 'viewBranchMenu' },
      { id: 'navOrders', label: '🛍️ Enterprise Orders', view: 'viewOrders' }
    ];
  } else if (state.user.role === 'BRANCH_STAFF') {
    links = [
      { id: 'navStaff', label: '👨‍🍳 Kitchen POS Board', view: 'viewStaff' }
    ];
  } else {
    links = [
      { id: 'navCustomer', label: '☕ Café Menu Order', view: 'viewCustomer' }
    ];
  }

  links.forEach((link, idx) => {
    const a = document.createElement('a');
    a.className = `nav-item ${idx === 0 ? 'active' : ''}`;
    a.innerHTML = link.label;
    a.onclick = () => showView(link.view, a);
    nav.appendChild(a);
  });
}

function showDefaultView() {
  if (state.user.role === 'CAFE_OWNER' || state.user.role === 'SUPER_ADMIN') {
    loadOwnerDashboard();
  } else if (state.user.role === 'BRANCH_STAFF') {
    loadStaffDashboard();
  } else {
    loadCustomerMenu();
  }
}

function showView(viewId, clickedNavElement = null) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  if (clickedNavElement) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    clickedNavElement.classList.add('active');
  }

  if (viewId === 'viewOwnerDashboard') loadOwnerDashboard();
  if (viewId === 'viewBranches') loadBranchesView();
  if (viewId === 'viewMasterMenu') loadMasterMenuView();
  if (viewId === 'viewBranchMenu') loadBranchMenuView();
  if (viewId === 'viewOrders') loadOrdersView();
  if (viewId === 'viewStaff') loadStaffDashboard();
  if (viewId === 'viewCustomer') loadCustomerMenu();
}

// -------------------------------------------------------------
// 1. OWNER DASHBOARD VIEW (Dynamic Real Metrics)
// -------------------------------------------------------------
async function loadOwnerDashboard() {
  showPanel('viewOwnerDashboard');
  try {
    const [branches, masterItems, orders] = await Promise.all([
      apiCall('/branches').catch(() => []),
      apiCall('/menu/master').catch(() => []),
      apiCall('/orders/inhouse/live').catch(() => [])
    ]);

    state.branches = branches;
    state.masterItems = masterItems;
    state.orders = orders;

    // Real dynamic counts (No fake numbers!)
    document.getElementById('dashBranchCount').textContent = branches.length;
    document.getElementById('dashOrderCount').textContent = orders.length;
    document.getElementById('dashMasterCount').textContent = masterItems.length;

    // Render branch grid
    const grid = document.getElementById('dashBranchGrid');
    grid.innerHTML = '';
    
    if (branches.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: #78716C;">No branches created yet. Go to Physical Branches to add your first branch.</div>`;
    } else {
      branches.forEach(b => {
        const div = document.createElement('div');
        div.className = 'cafe-card';
        div.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="badge badge-amber">${b.city}</span>
            <span class="badge ${b.is_active ? 'badge-emerald' : 'badge-rose'}">${b.is_active ? 'Operating' : 'Closed'}</span>
          </div>
          <h4 style="font-size: 16px; font-weight:800; color:#1C1917;">${b.name}</h4>
          <p style="font-size:12px; color:#78716C; margin-top:4px;">${b.address}</p>
          <div style="margin-top: 12px; pt-8px; border-top:1px solid #F5F5F4; font-size:12px; color:#A8A29E; display:flex; justify-content:space-between;">
            <span>${b.phone || 'No phone set'}</span>
            <span style="font-weight:700; color:#B45309;">ID: ${b.id.substring(0,8)}</span>
          </div>
        `;
        grid.appendChild(div);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// 2. BRANCHES VIEW (CRUD + Edit & Delete)
// -------------------------------------------------------------
async function loadBranchesView() {
  showPanel('viewBranches');
  try {
    state.branches = await apiCall('/branches');
    renderBranchesGrid(state.branches);
  } catch (err) {
    console.error(err);
  }
}

function renderBranchesGrid(branchList) {
  const grid = document.getElementById('branchesGrid');
  grid.innerHTML = '';

  if (branchList.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 32px; text-align: center; color: #78716C;">No branches found. Click "+ Add New Branch" above to set up a location.</div>`;
    return;
  }

  branchList.forEach(b => {
    const card = document.createElement('div');
    card.className = 'cafe-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span class="badge badge-amber">${b.city}</span>
          <span class="badge ${b.is_active ? 'badge-emerald' : 'badge-rose'}">${b.is_active ? 'Active Branch' : 'Inactive'}</span>
        </div>
        <h3 style="font-size:18px; font-weight:800; color:#1C1917;">${b.name}</h3>
        <p style="font-size:13px; color:#78716C; margin-top:6px;">📍 ${b.address}</p>
        <p style="font-size:13px; color:#78716C; margin-top:4px;">📞 ${b.phone || 'No phone number provided'}</p>
      </div>

      <div style="margin-top:20px; padding-top:12px; border-top:1px solid #F5F5F4; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; font-weight:700; color:#A8A29E; font-family:monospace;">ID: ${b.id.substring(0,8)}</span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline btn-sm edit-branch-btn">✏️ Edit</button>
          <button class="btn btn-danger btn-sm delete-branch-btn">🗑️ Delete</button>
        </div>
      </div>
    `;

    card.querySelector('.edit-branch-btn').onclick = () => openEditBranchModal(b);
    card.querySelector('.delete-branch-btn').onclick = () => deleteBranch(b.id);
    grid.appendChild(card);
  });
}

function openEditBranchModal(branch) {
  document.getElementById('editBranchId').value = branch.id;
  document.getElementById('editBranchName').value = branch.name;
  document.getElementById('editBranchCity').value = branch.city;
  document.getElementById('editBranchAddress').value = branch.address;
  document.getElementById('editBranchPhone').value = branch.phone || '';
  openModal('editBranchModal');
}

async function deleteBranch(branchId) {
  if (!confirm('Are you sure you want to delete this branch?')) return;
  try {
    await apiCall(`/branches/${branchId}`, 'DELETE');
    loadBranchesView();
  } catch (err) {
    alert(err.message);
  }
}

// -------------------------------------------------------------
// 3. MASTER MENU CATALOG (Categories Bar + Edit/Delete/Toggle)
// -------------------------------------------------------------
async function loadMasterMenuView() {
  showPanel('viewMasterMenu');
  try {
    state.masterItems = await apiCall('/menu/master');
    
    // Merge categories
    const backendCategories = state.masterItems.map(i => i.category);
    state.categories = Array.from(new Set(['ALL', 'Hot Coffee', 'Cold Brew', 'Bakery', 'Snacks', 'Desserts', ...backendCategories]));
    
    renderMasterCategoryBar();
    renderMasterMenuGrid();
  } catch (err) {
    console.error(err);
  }
}

function renderMasterCategoryBar() {
  const bar = document.getElementById('masterCategoryBar');
  bar.innerHTML = '';

  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `category-pill ${state.selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`;
    btn.innerHTML = `<span>${cat}</span>`;
    
    if (cat !== 'ALL') {
      const delBtn = document.createElement('span');
      delBtn.innerHTML = ' ✕';
      delBtn.style.color = '#9F1239';
      delBtn.style.marginLeft = '4px';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteCategory(cat);
      };
      btn.appendChild(delBtn);
    }

    btn.onclick = () => {
      state.selectedCategory = cat;
      renderMasterCategoryBar();
      renderMasterMenuGrid();
    };
    bar.appendChild(btn);
  });

  // Small + Add Category Button
  const addCatBtn = document.createElement('button');
  addCatBtn.className = 'category-pill category-pill-add';
  addCatBtn.innerHTML = '+ Add Category';
  addCatBtn.onclick = () => openModal('addCategoryModal');
  bar.appendChild(addCatBtn);
}

function deleteCategory(catName) {
  state.categories = state.categories.filter(c => c !== catName);
  if (state.selectedCategory === catName) {
    state.selectedCategory = 'ALL';
  }
  renderMasterCategoryBar();
  renderMasterMenuGrid();
}

function renderMasterMenuGrid() {
  const grid = document.getElementById('masterMenuGrid');
  grid.innerHTML = '';

  const filtered = state.masterItems.filter(item => {
    return state.selectedCategory === 'ALL' || item.category.toLowerCase() === state.selectedCategory.toLowerCase();
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 32px; text-align: center; color: #78716C;">No catalog items found in category "${state.selectedCategory}". Click "+ Add Master Item" to add items.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cafe-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="badge badge-amber">${item.category}</span>
          <span style="font-size:16px; font-weight:800; color:#1C1917; background:#FEF3C7; padding:2px 8px; border-radius:8px;">$${item.base_price.toFixed(2)}</span>
        </div>
        <h3 style="font-size:16px; font-weight:800; color:#1C1917;">${item.name}</h3>
        <p style="font-size:12px; color:#78716C; margin-top:6px;">${item.description || 'No description provided.'}</p>
      </div>

      <div style="margin-top:16px; padding-top:12px; border-top:1px solid #F5F5F4; display:flex; justify-content:space-between; align-items:center;">
        <button class="btn ${item.is_active ? 'btn-outline' : 'btn-primary'} btn-sm toggle-master-btn">
          ${item.is_active ? '✅ Available' : '🚫 Disabled'}
        </button>

        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline btn-sm edit-master-btn">✏️</button>
          <button class="btn btn-danger btn-sm delete-master-btn">🗑️</button>
        </div>
      </div>
    `;

    card.querySelector('.toggle-master-btn').onclick = () => toggleMasterActive(item);
    card.querySelector('.edit-master-btn').onclick = () => openEditMasterModal(item);
    card.querySelector('.delete-master-btn').onclick = () => deleteMasterItem(item.id);

    grid.appendChild(card);
  });
}

async function toggleMasterActive(item) {
  try {
    await apiCall(`/menu/master/${item.id}`, 'PUT', { is_active: !item.is_active });
    loadMasterMenuView();
  } catch (err) {
    alert(err.message);
  }
}

function openEditMasterModal(item) {
  document.getElementById('editMasterItemId').value = item.id;
  document.getElementById('editMasterName').value = item.name;
  document.getElementById('editMasterBasePrice').value = item.base_price;
  document.getElementById('editMasterDescription').value = item.description || '';
  
  populateCategoryDropdown('editMasterCategorySelect', item.category);
  openModal('editMasterItemModal');
}

async function deleteMasterItem(id) {
  if (!confirm('Are you sure you want to delete this item from the Master Catalog?')) return;
  try {
    await apiCall(`/menu/master/${id}`, 'DELETE');
    loadMasterMenuView();
  } catch (err) {
    alert(err.message);
  }
}

// -------------------------------------------------------------
// 4. BRANCH MENU VIEW (Location Pricing + Delete Item)
// -------------------------------------------------------------
async function loadBranchMenuView() {
  showPanel('viewBranchMenu');
  try {
    const [branches, masterItems] = await Promise.all([
      apiCall('/branches'),
      apiCall('/menu/master')
    ]);
    state.branches = branches;
    state.masterItems = masterItems;

    renderBranchSelectorBar();
    if (branches.length > 0) {
      if (!state.selectedBranchId) state.selectedBranchId = branches[0].id;
      loadBranchMenuItems(state.selectedBranchId);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderBranchSelectorBar() {
  const bar = document.getElementById('branchSelectorBar');
  bar.innerHTML = '';

  state.branches.forEach(b => {
    const btn = document.createElement('button');
    btn.className = `btn ${state.selectedBranchId === b.id ? 'btn-primary' : 'btn-outline'} btn-sm`;
    btn.textContent = `🏬 ${b.name} (${b.city})`;
    btn.onclick = () => {
      state.selectedBranchId = b.id;
      renderBranchSelectorBar();
      loadBranchMenuItems(b.id);
    };
    bar.appendChild(btn);
  });
}

async function loadBranchMenuItems(branchId) {
  try {
    state.branchMenuItems = await apiCall(`/menu/branch/${branchId}`);
    renderBranchMenuTable();
  } catch (err) {
    console.error(err);
  }
}

function renderBranchMenuTable() {
  const tbody = document.getElementById('branchMenuTableBody');
  tbody.innerHTML = '';

  if (state.branchMenuItems.length === 0) {
    tbody.innerHTML = `<tr><td colSpan="6" style="text-align:center; padding:24px; color:#78716C;">No items assigned to this branch yet. Click "+ Add Item to Branch" to offer menu items.</td></tr>`;
    return;
  }

  state.branchMenuItems.forEach(item => {
    const tr = document.createElement('tr');
    const effPrice = item.effective_price || item.price_override || 0.0;
    
    tr.innerHTML = `
      <td style="font-weight:700;">${item.name}</td>
      <td><span class="badge badge-amber">${item.category}</span></td>
      <td style="font-weight:800; color:#1C1917;">$${effPrice.toFixed(2)}</td>
      <td>${item.price_override !== null && item.price_override !== undefined ? `<span class="badge badge-amber">$${item.price_override.toFixed(2)}</span>` : '<span style="color:#A8A29E; font-style:italic;">Inherited</span>'}</td>
      <td><span class="badge ${item.is_available ? 'badge-emerald' : 'badge-rose'}">${item.is_available ? 'In Stock' : 'Disabled'}</span></td>
      <td style="text-align:right;">
        <button class="btn ${item.is_available ? 'btn-outline' : 'btn-primary'} btn-sm toggle-stock-btn">
          ${item.is_available ? 'Disable' : 'Enable'}
        </button>
        <button class="btn btn-danger btn-sm delete-branch-item-btn" style="margin-left:4px;">🗑️</button>
      </td>
    `;

    tr.querySelector('.toggle-stock-btn').onclick = () => toggleBranchStock(item);
    tr.querySelector('.delete-branch-item-btn').onclick = () => deleteBranchMenuItem(item.id);
    tbody.appendChild(tr);
  });
}

async function toggleBranchStock(item) {
  try {
    await apiCall(`/menu/branch/${item.id}`, 'PATCH', { is_available: !item.is_available });
    loadBranchMenuItems(state.selectedBranchId);
  } catch (err) {
    alert(err.message);
  }
}

async function deleteBranchMenuItem(itemId) {
  if (!confirm('Remove this item from branch menu?')) return;
  try {
    await apiCall(`/menu/branch/${itemId}`, 'DELETE');
    loadBranchMenuItems(state.selectedBranchId);
  } catch (err) {
    alert(err.message);
  }
}

// -------------------------------------------------------------
// 5. ENTERPRISE ORDERS VIEW
// -------------------------------------------------------------
async function loadOrdersView() {
  showPanel('viewOrders');
  try {
    state.orders = await apiCall('/orders/inhouse/live').catch(() => []);
    renderOrdersTable('ALL');
  } catch (err) {
    console.error(err);
  }
}

function renderOrdersTable(statusFilter = 'ALL') {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '';

  const filtered = state.orders.filter(o => statusFilter === 'ALL' || o.status === statusFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colSpan="5" style="text-align:center; padding:24px; color:#78716C;">No orders match the selected filter.</td></tr>`;
    return;
  }

  filtered.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700; font-family:monospace;">#${o.id.substring(0,8)}</td>
      <td><span class="badge ${o.order_type === 'CUSTOMER_ONLINE' ? 'badge-sky' : 'badge-amber'}">${o.order_type === 'CUSTOMER_ONLINE' ? 'Online' : 'POS In-House'}</span></td>
      <td style="font-weight:800;">$${o.total_amount.toFixed(2)}</td>
      <td><span class="badge badge-${getOrderStatusBadgeClass(o.status)}">${o.status}</span></td>
      <td style="color:#78716C;">${o.created_at ? new Date(o.created_at).toLocaleString() : 'Just now'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function getOrderStatusBadgeClass(status) {
  if (status === 'PENDING') return 'amber';
  if (status === 'IN_PREPARATION') return 'sky';
  if (status === 'COMPLETED') return 'emerald';
  return 'rose';
}

// -------------------------------------------------------------
// 6. STAFF KITCHEN POS BOARD
// -------------------------------------------------------------
async function loadStaffDashboard() {
  showPanel('viewStaff');
  try {
    state.orders = await apiCall('/orders/inhouse/live');
    
    const pending = state.orders.filter(o => o.status === 'PENDING');
    const prep = state.orders.filter(o => o.status === 'IN_PREPARATION');
    const completed = state.orders.filter(o => o.status === 'COMPLETED');

    renderStaffCol('staffPendingCol', pending, 'IN_PREPARATION', 'Start Kitchen Prep');
    renderStaffCol('staffPrepCol', prep, 'COMPLETED', 'Mark Ready & Complete');
    renderStaffCol('staffCompletedCol', completed.slice(0,5), null, null);
  } catch (err) {
    console.error(err);
  }
}

function renderStaffCol(colId, list, nextStatus, nextBtnText) {
  const container = document.getElementById(colId);
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:16px; color:#78716C; font-size:12px;">No orders in queue.</div>`;
    return;
  }

  list.forEach(o => {
    const card = document.createElement('div');
    card.style.background = '#FAFAFA';
    card.style.border = '1px solid #E7E5E4';
    card.style.borderRadius = '12px';
    card.style.padding = '12px';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
        <span style="font-weight:800; font-family:monospace;">#${o.id.substring(0,8)}</span>
        <span class="badge badge-amber">$${o.total_amount.toFixed(2)}</span>
      </div>
      ${nextStatus ? `<button class="btn btn-primary btn-sm next-status-btn" style="width:100%; margin-top:8px;">${nextBtnText}</button>` : ''}
    `;

    if (nextStatus) {
      card.querySelector('.next-status-btn').onclick = async () => {
        await apiCall(`/orders/customer/${o.id}/status`, 'PATCH', { status: nextStatus });
        loadStaffDashboard();
      };
    }
    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 7. CUSTOMER MENU & ONLINE CHECKOUT
// -------------------------------------------------------------
async function loadCustomerMenu() {
  showPanel('viewCustomer');
  try {
    const branches = await apiCall('/branches');
    if (branches.length > 0) {
      const items = await apiCall(`/menu/branch/${branches[0].id}`);
      state.branchMenuItems = items.filter(i => i.is_available);
      renderCustomerMenuGrid();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderCustomerMenuGrid() {
  const grid = document.getElementById('customerMenuGrid');
  grid.innerHTML = '';

  state.branchMenuItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cafe-card';
    card.innerHTML = `
      <span class="badge badge-amber">${item.category}</span>
      <h4 style="font-size:15px; font-weight:800; margin-top:8px;">${item.name}</h4>
      <div style="font-size:16px; font-weight:800; color:#1C1917; margin-top:8px;">$${(item.effective_price || item.price_override || 0.0).toFixed(2)}</div>
      <button class="btn btn-primary btn-sm add-to-cart-btn" style="width:100%; margin-top:12px;">+ Add to Order</button>
    `;
    card.querySelector('.add-to-cart-btn').onclick = () => {
      state.cart.push(item);
      renderCart();
    };
    grid.appendChild(card);
  });
}

function renderCart() {
  const container = document.getElementById('customerCartItems');
  const totalText = document.getElementById('cartTotalText');

  if (state.cart.length === 0) {
    container.innerHTML = 'Cart is empty.';
    totalText.textContent = '$0.00';
    return;
  }

  let total = 0;
  container.innerHTML = '';
  state.cart.forEach((item, idx) => {
    const price = item.effective_price || item.price_override || 0.0;
    total += price;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.fontSize = '12px';
    div.style.padding = '4px 0';
    div.innerHTML = `<span>${item.name}</span><strong>$${price.toFixed(2)}</strong>`;
    container.appendChild(div);
  });
  totalText.textContent = `$${total.toFixed(2)}`;
}

// Modal Helpers
function openModal(modalId) {
  document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

function showPanel(panelId) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  const p = document.getElementById(panelId);
  if (p) p.classList.add('active');
}

function populateCategoryDropdown(selectId, selectedValue = '') {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '';
  state.categories.filter(c => c !== 'ALL').forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedValue) opt.selected = true;
    sel.appendChild(opt);
  });
}

// Event Listeners Registration
document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Auth toggle
  document.getElementById('toRegister').onclick = (e) => {
    e.preventDefault();
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('registerView').style.display = 'block';
  };

  document.getElementById('toLogin').onclick = (e) => {
    e.preventDefault();
    document.getElementById('registerView').style.display = 'none';
    document.getElementById('loginView').style.display = 'block';
  };

  document.getElementById('logoutBtn').onclick = logout;

  // Login Submit
  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('loginError');
    errBox.style.display = 'none';

    try {
      const data = await apiCall('/auth/login', 'POST', {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      });
      login(data);
    } catch (err) {
      errBox.textContent = err.message;
      errBox.style.display = 'block';
    }
  };

  // Register Submit
  document.getElementById('registerForm').onsubmit = async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('registerError');
    errBox.style.display = 'none';

    const role = document.getElementById('regRole').value;
    const body = {
      full_name: document.getElementById('regFullName').value,
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value,
      role: role,
      tenant_name: role === 'CAFE_OWNER' ? document.getElementById('regTenantName').value : undefined
    };

    try {
      await apiCall('/auth/register', 'POST', body);
      alert('Registration successful! Please login.');
      document.getElementById('toLogin').click();
    } catch (err) {
      errBox.textContent = err.message;
      errBox.style.display = 'block';
    }
  };

  // Modals Open/Close
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    };
  });

  document.getElementById('openAddBranchModalBtn').onclick = () => openModal('addBranchModal');
  document.getElementById('openAddMasterItemModalBtn').onclick = () => {
    populateCategoryDropdown('masterCategorySelect');
    openModal('addMasterItemModal');
  };
  document.getElementById('openAddBranchItemModalBtn').onclick = () => {
    const sel = document.getElementById('branchItemMasterSelect');
    sel.innerHTML = '';
    state.masterItems.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.category}) - Base Price: $${m.base_price.toFixed(2)}`;
      sel.appendChild(opt);
    });
    openModal('addBranchItemModal');
  };

  // Add Branch Submit
  document.getElementById('addBranchForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/branches', 'POST', {
        name: document.getElementById('branchName').value,
        city: document.getElementById('branchCity').value,
        address: document.getElementById('branchAddress').value,
        phone: document.getElementById('branchPhone').value
      });
      closeModal('addBranchModal');
      loadBranchesView();
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit Branch Submit
  document.getElementById('editBranchForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editBranchId').value;
    try {
      await apiCall(`/branches/${id}`, 'PUT', {
        name: document.getElementById('editBranchName').value,
        city: document.getElementById('editBranchCity').value,
        address: document.getElementById('editBranchAddress').value,
        phone: document.getElementById('editBranchPhone').value
      });
      closeModal('editBranchModal');
      loadBranchesView();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Master Item Submit
  document.getElementById('addMasterItemForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/menu/master', 'POST', {
        name: document.getElementById('masterName').value,
        category: document.getElementById('masterCategorySelect').value,
        base_price: parseFloat(document.getElementById('masterBasePrice').value),
        description: document.getElementById('masterDescription').value
      });
      closeModal('addMasterItemModal');
      loadMasterMenuView();
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit Master Item Submit
  document.getElementById('editMasterItemForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editMasterItemId').value;
    try {
      await apiCall(`/menu/master/${id}`, 'PUT', {
        name: document.getElementById('editMasterName').value,
        category: document.getElementById('editMasterCategorySelect').value,
        base_price: parseFloat(document.getElementById('editMasterBasePrice').value),
        description: document.getElementById('editMasterDescription').value
      });
      closeModal('editMasterItemModal');
      loadMasterMenuView();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Category Submit
  document.getElementById('addCategoryForm').onsubmit = (e) => {
    e.preventDefault();
    const catName = document.getElementById('newCategoryInput').value.trim();
    if (catName && !state.categories.includes(catName)) {
      state.categories.push(catName);
      state.selectedCategory = catName;
    }
    document.getElementById('newCategoryInput').value = '';
    closeModal('addCategoryModal');
    renderMasterCategoryBar();
    renderMasterMenuGrid();
  };

  // Add Branch Item Submit
  document.getElementById('addBranchItemForm').onsubmit = async (e) => {
    e.preventDefault();
    const masterId = document.getElementById('branchItemMasterSelect').value;
    const masterItem = state.masterItems.find(m => m.id === masterId);
    const po = document.getElementById('branchItemPriceOverride').value;

    try {
      await apiCall('/menu/branch', 'POST', {
        branch_id: state.selectedBranchId,
        master_menu_item_id: masterId,
        name: masterItem ? masterItem.name : 'Menu Item',
        category: masterItem ? masterItem.category : 'General',
        price_override: po ? parseFloat(po) : undefined
      });
      closeModal('addBranchItemModal');
      loadBranchMenuItems(state.selectedBranchId);
    } catch (err) {
      alert(err.message);
    }
  };

  // Order status filter buttons
  document.querySelectorAll('#orderStatusFilterBar .category-pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#orderStatusFilterBar .category-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderOrdersTable(btn.getAttribute('data-status'));
    };
  });

  // Confirm Customer Order
  document.getElementById('confirmCustomerOrderBtn').onclick = async () => {
    if (state.cart.length === 0) return;
    try {
      await apiCall('/orders/customer', 'POST', {
        branch_id: state.branches[0]?.id || state.selectedBranchId,
        items: state.cart.map(c => ({
          branch_menu_item_id: c.id,
          quantity: 1
        })),
        order_type: 'CUSTOMER_ONLINE'
      });
      alert('Order placed successfully!');
      state.cart = [];
      renderCart();
    } catch (err) {
      alert(err.message);
    }
  };
});
