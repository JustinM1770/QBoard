/* QBoard SCM â€” modulo de cadena de suministro (Etapa 2).
   SPA aislada: no depende del app.js del CRM, solo comparte estilo.css y el login. */
(function () {
  'use strict';

  // ---- sesion (reusa el login del CRM) ----
  const token = localStorage.getItem('crm_token');
  if (!token) { location.href = 'login.html'; return; }
  const usuario = JSON.parse(localStorage.getItem('crm_usuario') || '{}');
  const uNombre = document.getElementById('uNombre');
  if (uNombre && usuario.nombre) {
    uNombre.textContent = usuario.nombre;
    document.getElementById('uAvatar').textContent = (usuario.nombre[0] || 'A').toUpperCase();
  }

  // ---- helpers ----
  const API = 'api/';
  const $ = (s, r = document) => r.querySelector(s);
  const content = $('#content');
  const host = $('#modalHost');
  const alertaHost = $('#alertaHost');
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((data && data.error) || 'Error de red');
    return data;
  }

  function pill(cls, txt) { return `<span class="pill ${cls}">${esc(txt)}</span>`; }
  const ESTADO_LBL = { pendiente: 'Pendiente', en_proceso: 'En proceso', surtido: 'Surtido', cancelado: 'Cancelado' };
  const lblEstado = (e) => ESTADO_LBL[e] || e;

  // alerta de inventario segun stock actual vs minimo
  function alertaStock(act, min) {
    act = +act; min = +min;
    if (act <= 0) return { txt: 'Sin stock', cls: 'a-sin' };
    if (act <= min) return { txt: 'Stock bajo', cls: 'a-bajo' };
    if (act <= min * 1.5) return { txt: 'Poco inventario', cls: 'a-poco' };
    return { txt: 'Disponible', cls: 'a-ok' };
  }
  const badgeStock = (act, min) => { const a = alertaStock(act, min); return `<span class="alerta ${a.cls}">${a.txt}</span>`; };

  // ---- alerta visual de pantalla completa (inventario bajo) ----
  function cerrarAlerta() { alertaHost.innerHTML = ''; }
  function mostrarAlerta(sin, bajo) {
    const total = sin.length + bajo.length;
    const fila = (p, txt, cls) => `<div class="row"><b>${esc(p.nombre)}</b>
      <span style="display:flex;gap:10px;align-items:center"><span class="alerta ${cls}">${txt}</span>
      <span style="color:var(--faint)">${p.stock_actual}/${p.stock_minimo}</span></span></div>`;
    alertaHost.innerHTML = `
      <div class="alerta-bg">
        <div class="alerta-card">
          <div class="ico">!</div>
          <h2>Alerta de inventario</h2>
          <p class="sub" style="margin:0">Hay <b style="color:var(--ink)">${total}</b> producto(s) que requieren atenciÃ³n:
             <b style="color:var(--rojo)">${sin.length} sin stock</b> y <b style="color:#fb923c">${bajo.length} en stock bajo</b>.
             Los productos PUSH ya generaron su pedido de reposiciÃ³n automÃ¡tico al proveedor (aparece como "En proceso").</p>
          <div class="alerta-list">
            ${sin.map(p => fila(p, 'Sin stock', 'a-sin')).join('')}
            ${bajo.map(p => fila(p, 'Stock bajo', 'a-bajo')).join('')}
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn sm ghost" id="aCerrar">Entendido</button><div style="flex:1"></div>
            <button class="btn sm" id="aVer">Ver inventario</button>
          </div>
        </div>
      </div>`;
    $('#aCerrar').onclick = cerrarAlerta;
    $('#aVer').onclick = () => { cerrarAlerta(); ir('inventario'); };
  }
  async function chequeoAlertas() {
    try {
      const inv = await api('inventario.php');
      const sin  = inv.filter(p => +p.stock_actual <= 0);
      const bajo = inv.filter(p => +p.stock_actual > 0 && +p.stock_actual <= +p.stock_minimo);
      if (sin.length + bajo.length > 0) mostrarAlerta(sin, bajo);
    } catch (e) {}
  }
  alertaHost.addEventListener('click', e => { if (e.target.classList.contains('alerta-bg')) cerrarAlerta(); });
  function modal(html) { host.innerHTML = `<div class="modal-bg"><div class="modal">${html}</div></div>`; }
  function cerrarModal() { host.innerHTML = ''; }
  host.addEventListener('click', e => { if (e.target.classList.contains('modal-bg')) cerrarModal(); });

  // ---- navegacion ----
  const titulos = {
    menu: 'MenÃº SCM', dashboard: 'Dashboard SCM', productos: 'Productos', proveedores: 'Proveedores',
    inventario: 'Inventario', movimientos: 'Movimientos', pedidos: 'Pedidos',
    logistica: 'LogÃ­stica Push / Pull', comparativa: 'Comparativa Push vs Pull', nivel: 'Nivel de madurez SCM',
  };
  const vistas = {};

  function ir(v) {
    document.querySelectorAll('.side a[data-vista]').forEach(a => a.classList.toggle('activo', a.dataset.vista === v));
    $('#topTitulo').textContent = titulos[v] || 'SCM';
    content.innerHTML = '<p class="sub">Cargando...</p>';
    (vistas[v] || vistas.menu)();
  }
  document.querySelectorAll('.side a[data-vista]').forEach(a =>
    a.addEventListener('click', () => ir(a.dataset.vista)));

  // ============ MENU ============
  vistas.menu = function () {
    const items = [
      ['productos', 'Productos', 'CatÃ¡logo con stock, costo, proveedor y estrategia logÃ­stica.'],
      ['proveedores', 'Proveedores', 'Directorio de proveedores y sus datos de contacto.'],
      ['inventario', 'Inventario', 'Existencias actuales y alertas de stock bajo.'],
      ['movimientos', 'Movimientos', 'Entradas y salidas que actualizan el stock en tiempo real.'],
      ['pedidos', 'Pedidos', 'Pedidos automÃ¡ticos (PUSH) y manuales desde Generar pedido (PULL).'],
      ['logistica', 'LogÃ­stica Push/Pull', 'Define la estrategia de cada producto.'],
      ['comparativa', 'Comparativa', 'Push vs Pull: productos, stock y valor de inventario.'],
      ['nivel', 'Nivel SCM', 'Madurez de la cadena de suministro segÃºn los datos.'],
      ['dashboard', 'Dashboard', 'Indicadores generales del Ã¡rea de suministro.'],
    ];
    content.innerHTML = `
      <div class="barra">
        <div><h1 class="display" style="font-size:26px">Cadena de Suministro</h1>
        <p class="sub" style="margin:0">Productos, proveedores, inventario y logÃ­stica Push/Pull.</p></div>
        <div class="sp"></div>
        <span class="alerta a-ok" title="El catÃ¡logo se lee y escribe en vivo sobre qboard.mx">Conectado en vivo a QBoard</span>
      </div>
      <div class="menu-grid">
        ${items.map(([v, t, d]) => `<div class="menu-card" data-go="${v}"><h4>${t}</h4><p>${d}</p></div>`).join('')}
      </div>`;
    content.querySelectorAll('[data-go]').forEach(c => c.addEventListener('click', () => ir(c.dataset.go)));
  };

  // ============ PRODUCTOS ============
  vistas.productos = async function () {
    const [prods, provs] = await Promise.all([api('productos.php'), api('proveedores.php')]);
    content.innerHTML = `
      <div class="barra">
        <input id="busca" placeholder="Buscar producto...">
        <select id="fEstr"><option value="">Todas las estrategias</option><option>PUSH</option><option>PULL</option></select>
        <div class="sp"></div>
        <button class="btn sm" id="nuevo">+ Nuevo producto</button>
      </div>
      <div class="card"><table>
        <thead><tr><th>Img</th><th>Producto</th><th>CategorÃ­a</th><th>Proveedor</th><th>Stock</th><th>MÃ­n</th><th>Costo</th><th>Estrategia</th><th></th></tr></thead>
        <tbody id="tb"></tbody>
      </table></div>`;
    const pintar = (lista) => {
      $('#tb').innerHTML = lista.map(p => `
        <tr>
          <td>${p.imagen ? `<img class="thumb" loading="lazy" src="${esc(p.imagen)}" alt="" onerror="this.style.display='none'">` : '<div class="thumb-ph">-</div>'}</td>
          <td><b>${esc(p.nombre)}</b></td>
          <td>${esc(p.categoria || '-')}</td>
          <td>${esc(p.proveedor || '-')}</td>
          <td class="${+p.stock_actual <= +p.stock_minimo ? 'stock-bajo' : 'stock-ok'}">${p.stock_actual}</td>
          <td>${p.stock_minimo}</td>
          <td>${money(p.costo_unitario)}</td>
          <td>${pill(p.estrategia_logistica === 'PUSH' ? 'push' : 'pull', p.estrategia_logistica)}</td>
          <td><span class="acc" data-edit="${p.id}">Editar</span><span class="acc" data-del="${p.id}">Borrar</span></td>
        </tr>`).join('') || '<tr><td colspan="9" style="color:var(--faint)">Sin productos</td></tr>';
      $('#tb').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formProducto(prods.find(x => x.id == b.dataset.edit), provs));
      $('#tb').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
        if (!confirm('Â¿Borrar este producto?')) return;
        await api('productos.php?id=' + b.dataset.del, { method: 'DELETE' }); ir('productos');
      });
    };
    pintar(prods);
    const filtrar = () => {
      const q = $('#busca').value.toLowerCase(), e = $('#fEstr').value;
      pintar(prods.filter(p => p.nombre.toLowerCase().includes(q) && (!e || p.estrategia_logistica === e)));
    };
    $('#busca').oninput = filtrar; $('#fEstr').onchange = filtrar;
    $('#nuevo').onclick = () => formProducto(null, provs);
  };

  function formProducto(p, provs) {
    const e = p || {};
    modal(`
      <h3>${p ? 'Editar' : 'Nuevo'} producto</h3>
      <div class="grid2" style="gap:10px">
        <div style="grid-column:1/3"><label>Nombre</label><input id="f_nombre" value="${esc(e.nombre || '')}"></div>
        <div><label>CategorÃ­a</label><input id="f_cat" value="${esc(e.categoria || '')}"></div>
        <div><label>Proveedor</label><select id="f_prov"><option value="">Sin proveedor</option>
          ${provs.map(v => `<option value="${v.id}" ${e.proveedor_id == v.id ? 'selected' : ''}>${esc(v.nombre)}</option>`).join('')}</select></div>
        <div><label>Stock actual</label><input id="f_stock" type="number" value="${e.stock_actual ?? 0}"></div>
        <div><label>Stock mÃ­nimo</label><input id="f_min" type="number" value="${e.stock_minimo ?? 0}"></div>
        <div><label>Costo unitario</label><input id="f_costo" type="number" step="0.01" value="${e.costo_unitario ?? 0}"></div>
        <div><label>Estrategia</label><select id="f_estr"><option ${e.estrategia_logistica === 'PUSH' ? 'selected' : ''}>PUSH</option><option ${e.estrategia_logistica === 'PULL' ? 'selected' : ''}>PULL</option></select></div>
        <div style="grid-column:1/3"><label>DescripciÃ³n</label><input id="f_desc" value="${esc(e.descripcion || '')}"></div>
        <div style="grid-column:1/3"><label>URL de imagen</label><input id="f_img" value="${esc(e.imagen || '')}" placeholder="https://..."></div>
      </div>
      <p class="err oculto" id="fe"></p>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn sm ghost" id="fc">Cancelar</button><div class="sp" style="flex:1"></div>
        <button class="btn sm" id="fg">Guardar</button>
      </div>`);
    $('#fc').onclick = cerrarModal;
    $('#fg').onclick = async () => {
      const body = {
        nombre: $('#f_nombre').value.trim(), categoria: $('#f_cat').value.trim(),
        proveedor_id: $('#f_prov').value || null, stock_actual: +$('#f_stock').value,
        stock_minimo: +$('#f_min').value, costo_unitario: +$('#f_costo').value,
        estrategia_logistica: $('#f_estr').value, descripcion: $('#f_desc').value.trim(),
        imagen: $('#f_img').value.trim(),
      };
      if (!body.nombre) { $('#fe').textContent = 'El nombre es obligatorio'; $('#fe').classList.remove('oculto'); return; }
      try {
        if (p) await api('productos.php?id=' + p.id, { method: 'PUT', body });
        else await api('productos.php', { method: 'POST', body });
        cerrarModal(); ir('productos');
      } catch (err) { $('#fe').textContent = err.message; $('#fe').classList.remove('oculto'); }
    };
  }

  // ============ PROVEEDORES ============
  vistas.proveedores = async function () {
    const provs = await api('proveedores.php');
    content.innerHTML = `
      <div class="barra"><input id="busca" placeholder="Buscar proveedor..."><div class="sp"></div><button class="btn sm" id="nuevo">+ Nuevo proveedor</button></div>
      <div class="card"><table>
        <thead><tr><th>Proveedor</th><th>Contacto</th><th>Correo</th><th>TelÃ©fono</th><th>DirecciÃ³n</th><th></th></tr></thead>
        <tbody id="tb"></tbody>
      </table></div>`;
    const pintar = (lista) => {
      $('#tb').innerHTML = lista.map(v => `
        <tr><td><b>${esc(v.nombre)}</b></td><td>${esc(v.contacto || '-')}</td><td>${esc(v.correo || '-')}</td><td>${esc(v.telefono || '-')}</td><td>${esc(v.direccion || '-')}</td>
        <td><span class="acc" data-edit="${v.id}">Editar</span><span class="acc" data-del="${v.id}">Borrar</span></td></tr>`).join('')
        || '<tr><td colspan="6" style="color:var(--faint)">Sin proveedores</td></tr>';
      $('#tb').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formProveedor(provs.find(x => x.id == b.dataset.edit)));
      $('#tb').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
        if (!confirm('Â¿Borrar proveedor?')) return;
        await api('proveedores.php?id=' + b.dataset.del, { method: 'DELETE' }); ir('proveedores');
      });
    };
    pintar(provs);
    $('#busca').oninput = () => { const q = $('#busca').value.toLowerCase(); pintar(provs.filter(v => v.nombre.toLowerCase().includes(q))); };
    $('#nuevo').onclick = () => formProveedor(null);
  };

  function formProveedor(v) {
    const e = v || {};
    modal(`
      <h3>${v ? 'Editar' : 'Nuevo'} proveedor</h3>
      <label>Nombre</label><input id="f_n" value="${esc(e.nombre || '')}">
      <label>Contacto</label><input id="f_c" value="${esc(e.contacto || '')}">
      <label>Correo</label><input id="f_e" value="${esc(e.correo || '')}">
      <label>TelÃ©fono</label><input id="f_t" value="${esc(e.telefono || '')}">
      <label>DirecciÃ³n</label><input id="f_d" value="${esc(e.direccion || '')}">
      <p class="err oculto" id="fe"></p>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn sm ghost" id="fc">Cancelar</button><div class="sp" style="flex:1"></div>
        <button class="btn sm" id="fg">Guardar</button></div>`);
    $('#fc').onclick = cerrarModal;
    $('#fg').onclick = async () => {
      const body = { nombre: $('#f_n').value.trim(), contacto: $('#f_c').value.trim(), correo: $('#f_e').value.trim(), telefono: $('#f_t').value.trim(), direccion: $('#f_d').value.trim() };
      if (!body.nombre) { $('#fe').textContent = 'El nombre es obligatorio'; $('#fe').classList.remove('oculto'); return; }
      try {
        if (v) await api('proveedores.php?id=' + v.id, { method: 'PUT', body });
        else await api('proveedores.php', { method: 'POST', body });
        cerrarModal(); ir('proveedores');
      } catch (err) { $('#fe').textContent = err.message; $('#fe').classList.remove('oculto'); }
    };
  }

  // ============ INVENTARIO ============
  vistas.inventario = async function () {
    const inv = await api('inventario.php');
    const sinStock = inv.filter(p => +p.stock_actual <= 0).length;
    const bajos = inv.filter(p => +p.stock_actual > 0 && +p.stock_actual <= +p.stock_minimo).length;
    const pocos = inv.filter(p => +p.stock_actual > +p.stock_minimo && +p.stock_actual <= +p.stock_minimo * 1.5).length;
    let filtro = 'todos', busq = '';
    const pintar = () => {
      const lista = inv.filter(p => {
        if (busq && !p.nombre.toLowerCase().includes(busq)) return false;
        if (filtro === 'sin') return +p.stock_actual <= 0;
        if (filtro === 'bajo') return +p.stock_actual > 0 && +p.stock_actual <= +p.stock_minimo;
        if (filtro === 'poco') return +p.stock_actual > +p.stock_minimo && +p.stock_actual <= +p.stock_minimo * 1.5;
        return true;
      });
      $('#invtb').innerHTML = lista.map(p => `
        <tr><td><b>${esc(p.nombre)}</b></td>
          <td class="${+p.stock_actual <= +p.stock_minimo ? 'stock-bajo' : 'stock-ok'}">${p.stock_actual}</td>
          <td>${p.stock_minimo}</td>
          <td>${pill(p.estrategia_logistica === 'PUSH' ? 'push' : 'pull', p.estrategia_logistica)}</td>
          <td><span class="${+p.stock_actual <= +p.stock_minimo ? 'stock-bajo' : 'stock-ok'}">${alertaStock(p.stock_actual, p.stock_minimo).txt}</span></td>
        </tr>`).join('') || '<tr><td colspan="5" style="color:var(--faint)">Sin resultados</td></tr>';
    };
    content.innerHTML = `
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi" data-f="sin" style="cursor:pointer"><div class="lbl">Sin stock</div><div class="num ${sinStock ? 'n' : ''}">${sinStock}</div><div class="foot">clic para filtrar</div></div>
        <div class="kpi" data-f="bajo" style="cursor:pointer"><div class="lbl">Stock bajo</div><div class="num ${bajos ? 'n' : ''}">${bajos}</div><div class="foot">clic para filtrar</div></div>
        <div class="kpi" data-f="poco" style="cursor:pointer"><div class="lbl">Poco inventario</div><div class="num ${pocos ? 'n' : ''}">${pocos}</div><div class="foot">clic para filtrar</div></div>
        <div class="kpi" data-f="todos" style="cursor:pointer"><div class="lbl">Unidades totales</div><div class="num v">${inv.reduce((a, p) => a + (+p.stock_actual), 0)}</div><div class="foot">ver todos</div></div>
      </div>
      <div class="barra"><input id="invBusca" placeholder="Buscar producto..."><div class="sp"></div></div>
      <div class="card"><h3 id="invTit">Existencias</h3><table>
        <thead><tr><th>Producto</th><th>Stock actual</th><th>MÃ­nimo</th><th>Estrategia</th><th>Estado</th></tr></thead>
        <tbody id="invtb"></tbody>
      </table></div>`;
    pintar();
    $('#invBusca').oninput = () => { busq = $('#invBusca').value.toLowerCase(); pintar(); };
    content.querySelectorAll('[data-f]').forEach(k => k.onclick = () => {
      filtro = k.dataset.f;
      $('#invTit').textContent = { sin: 'Sin stock', bajo: 'Stock bajo', poco: 'Poco inventario', todos: 'Existencias' }[filtro];
      pintar();
    });
  };

  // ============ MOVIMIENTOS ============
  async function traerUsuarios() { try { return await api('usuarios.php'); } catch (e) { return []; } }

  vistas.movimientos = async function () {
    const [movs, prods, usuarios] = await Promise.all([
      api('inventario.php?movimientos=1'), api('productos.php'), traerUsuarios(),
    ]);
    content.innerHTML = `
      <div class="barra">
        <select id="fTipo"><option value="">Todos los tipos</option><option value="entrada">Entradas</option><option value="salida">Salidas</option></select>
        <select id="fProd" style="width:220px"><option value="">Todos los productos</option>
          ${prods.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>
        <div class="sp"></div><button class="btn sm" id="nuevo">+ Nuevo movimiento</button>
      </div>
      <div class="card"><table>
        <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Usuario</th></tr></thead>
        <tbody id="tb"></tbody></table></div>`;
    const pintar = () => {
      const ft = $('#fTipo').value, fp = $('#fProd').value;
      const lista = movs.filter(m => (!ft || m.tipo === ft) && (!fp || m.producto_id == fp));
      $('#tb').innerHTML = lista.map(m => `
        <tr><td>${esc((m.fecha || '').replace('T', ' '))}</td>
          <td><b>${esc(m.producto)}</b></td>
          <td>${m.tipo === 'entrada' ? '<span class="stock-ok">Entrada</span>' : '<span class="stock-bajo">Salida</span>'}</td>
          <td>${m.cantidad}</td><td>${esc(m.motivo)}</td><td>${esc(m.usuario || '-')}</td></tr>`).join('')
        || '<tr><td colspan="6" style="color:var(--faint)">Sin movimientos</td></tr>';
    };
    pintar();
    $('#fTipo').onchange = pintar; $('#fProd').onchange = pintar;
    $('#nuevo').onclick = () => formMovimiento(prods, usuarios);
  };

  function formMovimiento(prods, usuarios) {
    const hoy = new Date().toISOString().slice(0, 10);
    modal(`
      <h3>Nuevo movimiento</h3>
      <label>Producto</label><select id="m_prod">${prods.map(p => `<option value="${p.id}">${esc(p.nombre)} (stock ${p.stock_actual})</option>`).join('')}</select>
      <label>Tipo</label>
      <div class="radios"><label><input type="radio" name="m_tipo" value="entrada" checked> Entrada (suma stock)</label>
        <label><input type="radio" name="m_tipo" value="salida"> Salida (resta stock)</label></div>
      <label>Cantidad</label><input id="m_cant" type="number" value="1" min="1">
      <label>Motivo</label><select id="m_mot"><option value="venta">Venta</option><option value="ajuste">Ajuste</option><option value="compra">Compra</option><option value="reposicion">ReposiciÃ³n</option></select>
      <label>Fecha</label><input id="m_fecha" type="date" value="${hoy}">
      <label>Usuario</label><select id="m_user"><option value="">Yo (${esc(usuario.nombre || 'actual')})</option>
        ${(usuarios || []).map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select>
      <p class="err oculto" id="fe"></p>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn sm ghost" id="fc">Cancelar</button><div class="sp" style="flex:1"></div>
        <button class="btn sm" id="fg">Registrar</button></div>`);
    $('#fc').onclick = cerrarModal;
    $('#fg').onclick = async () => {
      try {
        const tipo = document.querySelector('input[name="m_tipo"]:checked').value;
        const r = await api('inventario.php', { method: 'POST', body: {
          producto_id: +$('#m_prod').value, tipo, cantidad: +$('#m_cant').value,
          motivo: $('#m_mot').value, fecha: $('#m_fecha').value,
          usuario_id: $('#m_user').value || usuario.id || null } });
        cerrarModal();
        if (r.pedido_automatico) alert('Stock en el mÃ­nimo: se generÃ³ un pedido de reposiciÃ³n automÃ¡tico al proveedor (estrategia PUSH). Aparece en Pedidos como "En proceso".');
        ir('movimientos');
      } catch (err) { $('#fe').textContent = err.message; $('#fe').classList.remove('oculto'); }
    };
  }

  // ============ PEDIDOS ============
  vistas.pedidos = async function () {
    const [peds, prods] = await Promise.all([api('pedidos.php'), api('productos.php')]);
    content.innerHTML = `
      <div class="barra">
        <select id="fEst"><option value="">Todos los estados</option><option value="pendiente">Pendiente</option><option value="en_proceso">En proceso</option><option value="surtido">Surtido</option><option value="cancelado">Cancelado</option></select>
        <select id="fTipo"><option value="">Todos los tipos</option><option value="reposicion">AutomÃ¡tico (PUSH)</option><option value="manual">Manual (PULL)</option></select>
        <div class="sp"></div><button class="btn sm" id="nuevo">+ Generar pedido</button>
      </div>
      <div class="card"><table>
        <thead><tr><th>Folio</th><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody id="tb"></tbody></table></div>`;
    const folio = (id) => 'PC-' + String(id).padStart(3, '0');
    const pintar = () => {
      const fe = $('#fEst').value, ft = $('#fTipo').value;
      const lista = peds.filter(p => (!fe || p.estado === fe) && (!ft || p.tipo === ft));
      $('#tb').innerHTML = lista.map(p => `
        <tr><td><b>${folio(p.id)}</b></td><td>${esc((p.fecha || '').replace('T', ' ').slice(0, 16))}</td>
          <td>${esc(p.producto)}</td><td>${p.cantidad}</td>
          <td>${p.tipo === 'reposicion' ? pill('push', 'AutomÃ¡tico (PUSH)') : pill('pull', 'Manual (PULL)')}</td>
          <td>${pill('s-' + p.estado, lblEstado(p.estado))}</td>
          <td>${estadoAcciones(p)}</td></tr>`).join('') || '<tr><td colspan="7" style="color:var(--faint)">Sin pedidos</td></tr>';
      $('#tb').querySelectorAll('[data-estado]').forEach(b => b.onclick = async () => {
        await api(`pedidos.php?id=${b.dataset.id}&estado=${b.dataset.estado}`, { method: 'PUT' }); ir('pedidos');
      });
    };
    pintar();
    $('#fEst').onchange = pintar; $('#fTipo').onchange = pintar;
    $('#nuevo').onclick = () => formPedido(prods);
  };

  function estadoAcciones(p) {
    if (p.estado === 'pendiente') return `<span class="acc" data-id="${p.id}" data-estado="en_proceso">En proceso</span><span class="acc" data-id="${p.id}" data-estado="cancelado">Cancelar</span>`;
    if (p.estado === 'en_proceso') return `<span class="acc" data-id="${p.id}" data-estado="surtido">Marcar surtido</span>`;
    return '<span style="color:var(--faint)">â€”</span>';
  }

  function formPedido(prods) {
    const hoy = new Date().toISOString().slice(0, 10);
    const provDe = (id) => { const p = prods.find(x => x.id == id); return p ? (p.proveedor || 'Sin proveedor') : '-'; };
    modal(`
      <h3>Generar pedido manual (PULL)</h3>
      <p class="sub">Los pedidos PULL se hacen a mano cuando tÃº decides. Los PUSH se generan solos al llegar al mÃ­nimo.</p>
      <label>Producto</label><select id="p_prod">${prods.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>
      <label>Cantidad</label><input id="p_cant" type="number" value="10" min="1">
      <label>Proveedor</label><input id="p_prov" value="${esc(provDe(prods[0] && prods[0].id))}" readonly>
      <label>Fecha</label><input id="p_fecha" type="date" value="${hoy}">
      <label>Notas</label><input id="p_notas" placeholder="Opcional...">
      <p class="err oculto" id="fe"></p>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn sm ghost" id="fc">Cancelar</button><div class="sp" style="flex:1"></div>
        <button class="btn sm" id="fg">Crear pedido</button></div>`);
    $('#p_prod').onchange = () => { $('#p_prov').value = provDe($('#p_prod').value); };
    $('#fc').onclick = cerrarModal;
    $('#fg').onclick = async () => {
      try {
        await api('pedidos.php', { method: 'POST', body: {
          producto_id: +$('#p_prod').value, cantidad: +$('#p_cant').value,
          tipo: 'manual', fecha: $('#p_fecha').value, notas: $('#p_notas').value.trim() } });
        cerrarModal(); ir('pedidos');
      } catch (err) { $('#fe').textContent = err.message; $('#fe').classList.remove('oculto'); }
    };
  }

  // ============ LOGISTICA (Push/Pull) ============
  vistas.logistica = async function () {
    const prods = await api('productos.php');
    content.innerHTML = `
      <p class="sub">Define la estrategia de reposiciÃ³n de cada producto.</p>
      <div class="expl">
        <div class="c"><h4>${pill('push', 'PUSH')} ReposiciÃ³n automÃ¡tica</h4>
          <p>El sistema genera un pedido de reposiciÃ³n al proveedor <b>automÃ¡ticamente</b> cuando el stock llega al mÃ­nimo. Aparece en Pedidos como "En proceso".</p></div>
        <div class="c"><h4>${pill('pull', 'PULL')} Pedido manual</h4>
          <p>El pedido se genera <b>a mano desde "Generar pedido"</b>, solo cuando tÃº lo decides. No se repone solo.</p></div>
      </div>
      <div class="card" style="margin-top:14px"><table>
        <thead><tr><th>Producto</th><th>Stock</th><th>Estrategia actual</th><th>Cambiar a</th></tr></thead>
        <tbody>${prods.map(p => `
          <tr><td><b>${esc(p.nombre)}</b></td><td>${p.stock_actual}</td>
            <td>${pill(p.estrategia_logistica === 'PUSH' ? 'push' : 'pull', p.estrategia_logistica)}</td>
            <td><select data-id="${p.id}" class="selEstr" style="width:130px">
              <option ${p.estrategia_logistica === 'PUSH' ? 'selected' : ''}>PUSH</option>
              <option ${p.estrategia_logistica === 'PULL' ? 'selected' : ''}>PULL</option></select></td>
          </tr>`).join('')}</tbody>
      </table></div>`;
    content.querySelectorAll('.selEstr').forEach(s => s.onchange = async () => {
      await api(`productos.php?id=${s.dataset.id}&accion=estrategia`, { method: 'PUT', body: { estrategia_logistica: s.value } });
      ir('logistica');
    });
  };

  // ============ COMPARATIVA ============
  vistas.comparativa = async function () {
    const [data, mm, prods] = await Promise.all([
      api('reportes_scm.php?r=push_pull'),
      api('reportes_scm.php?r=push_pull_mensual'),
      api('productos.php'),
    ]);
    const push = data.find(d => d.estrategia === 'PUSH') || { productos: 0, stock_total: 0, valor_inventario: 0 };
    const pull = data.find(d => d.estrategia === 'PULL') || { productos: 0, stock_total: 0, valor_inventario: 0 };

    // barra comparativa de una metrica (PUSH vs PULL)
    const barra = (titulo, vPush, vPull, fmt) => {
      const max = Math.max(1, +vPush, +vPull);
      const f = fmt || (x => x);
      return `<div style="margin-bottom:16px"><div class="sub" style="margin:0 0 8px">${titulo}</div>
        <div class="hbar"><span class="lbl">${pill('push', 'PUSH')}</span>
          <div class="track"><div class="fill" style="width:${+vPush / max * 100}%;background:var(--azul)"></div></div>
          <span class="val">${f(vPush)}</span></div>
        <div class="hbar" style="margin-top:8px"><span class="lbl">${pill('pull', 'PULL')}</span>
          <div class="track"><div class="fill" style="width:${+vPull / max * 100}%;background:var(--morado)"></div></div>
          <span class="val">${f(vPull)}</span></div></div>`;
    };
    const maxM = Math.max(1, ...mm.map(x => Math.max(+x.push, +x.pull)));
    content.innerHTML = `
      <p class="sub">ComparaciÃ³n de reposiciÃ³n automÃ¡tica (PUSH) contra pedido manual (PULL).</p>
      <div class="grid2">
        <div class="card"><h3>Productos, stock y valor por estrategia</h3>
          ${barra('NÃºmero de productos', push.productos, pull.productos)}
          ${barra('Stock total (unidades)', push.stock_total, pull.stock_total)}
          ${barra('Valor de inventario', push.valor_inventario, pull.valor_inventario, money)}
        </div>
        <div class="card"><h3>Salidas por mes</h3>
          <div class="mbars">${mm.map(x => `
            <div class="mb"><div class="par">
              <span style="height:${+x.push / maxM * 100}%;background:var(--azul)"></span>
              <span style="height:${+x.pull / maxM * 100}%;background:var(--morado)"></span>
            </div><small>${esc(x.mes)}</small></div>`).join('')}</div>
          <div class="legend" style="flex-direction:row;gap:18px;margin-top:10px"><span><i style="background:var(--azul)"></i>PUSH</span><span><i style="background:var(--morado)"></i>PULL</span></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="barra"><h3 style="margin:0">Productos por estrategia</h3>
          <span style="margin-left:12px">${pill('push', 'PUSH')} ${push.productos} productos</span>
          <span>${pill('pull', 'PULL')} ${pull.productos} productos</span>
          <div class="sp"></div>
          <select id="fEstr"><option value="">Todas</option><option>PUSH</option><option>PULL</option></select>
        </div>
        <table><thead><tr><th>Producto</th><th>CategorÃ­a</th><th>Stock</th><th>Stock mÃ­n.</th><th>Estrategia</th></tr></thead>
          <tbody id="ctb"></tbody></table>
      </div>`;
    const pintarC = () => {
      const e = $('#fEstr').value;
      const lista = prods.filter(p => !e || p.estrategia_logistica === e);
      $('#ctb').innerHTML = lista.map(p => `
        <tr><td><b>${esc(p.nombre)}</b></td><td>${esc(p.categoria || '-')}</td>
          <td class="${+p.stock_actual <= +p.stock_minimo ? 'stock-bajo' : 'stock-ok'}">${p.stock_actual}</td><td>${p.stock_minimo}</td>
          <td>${pill(p.estrategia_logistica === 'PUSH' ? 'push' : 'pull', p.estrategia_logistica)}</td></tr>`).join('');
    };
    pintarC();
    $('#fEstr').onchange = pintarC;
  };

  // ============ NIVEL SCM ============
  vistas.nivel = async function () {
    const d = await api('scm.php');
    const niveles = ['Inicial', 'En desarrollo', 'Optimizado'];
    const descs = {
      'Inicial': 'Sin control formal, manejo reactivo.',
      'En desarrollo': 'Procesos y estrategias definidas.',
      'Optimizado': 'ReposiciÃ³n automÃ¡tica, sin quiebres.',
    };
    const i = d.indicadores;
    const chk = d.checklist || [];
    content.innerHTML = `
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">Nivel actual</h3>
          <b style="color:var(--verde)">${esc(d.nivel_scm)}</b></div>
        <div class="slider"><div class="fill" style="width:${d.progreso ?? 0}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--faint)"><span>Inicial</span><span>En desarrollo</span><span>Optimizado</span></div>
      </div>
      <div class="madurez">${niveles.map(n => `
        <div class="nivel ${n === d.nivel_scm ? 'on' : ''}"><b>${n}</b><small>${descs[n]}</small></div>`).join('')}</div>
      <div class="grid2">
        <div class="card"><h3>Checklist de avance</h3>
          ${chk.map(c => `<div class="chk ${c.ok ? 'on' : 'off'}"><span class="box ${c.ok ? 'on' : ''}">${c.ok ? 'âœ“' : ''}</span>${esc(c.texto)}</div>`).join('')}
        </div>
        <div class="card"><h3>DescripciÃ³n del nivel</h3>
          <p class="sub">${esc(d.descripcion)}</p>
          <p style="font-size:13px;color:var(--muted)">Sugerido por los datos: <b style="color:var(--ink)">${esc(d.sugerido)}</b></p>
          <label style="margin-top:10px">Ajustar nivel manualmente</label>
          <div style="display:flex;gap:10px;align-items:center">
            <select id="selN" style="width:200px">${niveles.map(n => `<option ${n === d.nivel_scm ? 'selected' : ''}>${n}</option>`).join('')}</select>
            <button class="btn sm" id="guardarN" style="margin:0">Guardar</button></div>
        </div>
      </div>
      <div class="kpis" style="margin-top:14px"><div class="kpi"><div class="lbl">Productos</div><div class="num">${i.total_productos}</div></div>
        <div class="kpi"><div class="lbl">Con estrategia</div><div class="num v">${i.con_estrategia}</div></div>
        <div class="kpi"><div class="lbl">Con proveedor</div><div class="num">${i.con_proveedor}</div></div>
        <div class="kpi"><div class="lbl">En stock crÃ­tico</div><div class="num ${i.en_stock_critico ? 'n' : ''}">${i.en_stock_critico}</div></div></div>`;
    $('#guardarN').onclick = async () => { await api('scm.php', { method: 'PUT', body: { nivel_scm: $('#selN').value } }); ir('nivel'); };
  };

  // ============ DASHBOARD ============
  vistas.dashboard = async function () {
    const d = await api('reportes_scm.php');
    const t = d.tarjetas;
    const maxV = Math.max(1, ...d.mas_vendidos.map(x => +x.total_salidas));
    const rot = d.rotacion || { alta: 0, media: 0, baja: 0, porcentaje: 0 };
    const rtot = Math.max(1, rot.alta + rot.media + rot.baja);
    const gAlta = rot.alta / rtot * 100, gMedia = rot.media / rtot * 100;
    const donut = `conic-gradient(var(--verde) 0 ${gAlta}%, var(--naranja) ${gAlta}% ${gAlta + gMedia}%, var(--rojo) ${gAlta + gMedia}% 100%)`;
    const mm = d.push_pull_mensual || [];
    const maxM = Math.max(1, ...mm.map(x => Math.max(+x.push, +x.pull)));
    content.innerHTML = `
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi"><div class="lbl">Productos</div><div class="num">${t.total_productos}</div></div>
        <div class="kpi"><div class="lbl">Proveedores</div><div class="num">${t.total_proveedores}</div></div>
        <div class="kpi"><div class="lbl">Pedidos pendientes</div><div class="num n">${t.pedidos_pendientes}</div></div>
        <div class="kpi"><div class="lbl">Productos en stock bajo</div><div class="num ${t.productos_criticos ? 'n' : ''}">${t.productos_criticos}</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Productos mÃ¡s vendidos</h3>
          <div class="hbars">${d.mas_vendidos.slice(0, 6).map(x => `
            <div class="hbar"><span class="lbl" title="${esc(x.nombre)}">${esc(x.nombre)}</span>
              <div class="track"><div class="fill" style="width:${+x.total_salidas / maxV * 100}%;background:var(--verde)"></div></div>
              <span class="val">${x.total_salidas}</span></div>`).join('')}</div></div>
        <div class="card"><h3>RotaciÃ³n de inventario</h3>
          <div class="charts">
            <div class="donut-rot" style="background:${donut}"><div class="hole" style="width:150px;height:150px"><div style="width:96px;height:96px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:800">${rot.porcentaje}%</div></div></div>
            <div class="legend"><span><i style="background:var(--verde)"></i>Alta rotaciÃ³n (${rot.alta})</span><span><i style="background:var(--naranja)"></i>Media rotaciÃ³n (${rot.media})</span><span><i style="background:var(--rojo)"></i>Baja rotaciÃ³n (${rot.baja})</span></div>
          </div></div>
      </div>
      <div class="grid2" style="margin-top:13px">
        <div class="card"><h3>Inventario crÃ­tico</h3><div class="riesgo">
          ${d.inventario_critico.length ? d.inventario_critico.slice(0, 6).map(x => `
            <div class="r"><span>${esc(x.nombre)}</span><small>${x.stock_actual}/${x.stock_minimo} Â· ${x.estrategia_logistica}</small></div>`).join('')
            : '<p class="sub">Sin productos en stock crÃ­tico.</p>'}</div></div>
        <div class="card"><h3>Comparativa PUSH vs PULL</h3>
          <div class="mbars">${mm.map(x => `
            <div class="mb"><div class="par">
              <span style="height:${+x.push / maxM * 100}%;background:var(--azul)"></span>
              <span style="height:${+x.pull / maxM * 100}%;background:var(--morado)"></span>
            </div><small>${esc(x.mes)}</small></div>`).join('')}</div>
          <div class="legend" style="flex-direction:row;gap:18px;margin-top:10px"><span><i style="background:var(--azul)"></i>PUSH</span><span><i style="background:var(--morado)"></i>PULL</span></div></div>
      </div>`;
  };

  // arranque
  ir('menu');
  chequeoAlertas();
})();