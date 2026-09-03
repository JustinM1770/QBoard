/* QBoard CRM — lógica del front (vanilla JS) */

// --- Sesión / guardia ---
const token = localStorage.getItem('crm_token');
const USER  = JSON.parse(localStorage.getItem('crm_usuario') || 'null');
if (!token || !USER) location.href = 'login.html';

document.getElementById('uNombre').textContent = USER?.nombre || 'Usuario';
document.getElementById('uAvatar').textContent = (USER?.nombre || 'U')[0].toUpperCase();
document.getElementById('salir').onclick = () => {
  localStorage.removeItem('crm_token'); localStorage.removeItem('crm_usuario');
  location.href = 'login.html';
};

// --- Helpers ---
const $  = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function api(path, method = 'GET', data = null) {
  const opt = { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } };
  if (data) opt.body = JSON.stringify(data);
  const r = await fetch('api/' + path, opt);
  return r.json();
}
const pill = e => `<span class="pill e-${esc(e)}">${esc(e)}</span>`;
const estadoTxt = s => `<span class="st-${esc(s)}">${s === 'activo' ? 'Activo' : 'Inactivo'}</span>`;
const fmtFecha = f => (f || '').replace('T', ' ').slice(0, 16);
const estrellas = n => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));

// --- Navegación ---
const VISTAS = ['dashboard', 'clientes', 'detalle', 'actividad', 'reportes'];
const TITULOS = { dashboard:'Dashboard', clientes:'Clientes', detalle:'Detalle de cliente', actividad:'Mi actividad', reportes:'Reportes y métricas' };
function mostrar(v, arg) {
  VISTAS.forEach(x => $('#vista-' + x).classList.toggle('oculto', x !== v));
  document.querySelectorAll('.side a[data-vista]').forEach(a => a.classList.toggle('activo', a.dataset.vista === v));
  $('#topTitulo').textContent = TITULOS[v];
  if (v === 'dashboard') dashboardView();
  if (v === 'clientes')  clientesView();
  if (v === 'detalle')   detalleView(arg);
  if (v === 'actividad') actividadView();
  if (v === 'reportes')  reportesView();
}
document.querySelectorAll('.side a[data-vista]').forEach(a => a.onclick = () => mostrar(a.dataset.vista));

// --- Gráficas simples (sin librerías) ---
function donut(activos, inactivos) {
  const total = activos + inactivos || 1;
  const p = Math.round(activos / total * 100);
  return `<div class="charts">
    <div class="donut" style="background:conic-gradient(var(--verde) 0 ${p}%, var(--naranja) ${p}% 100%)">
      <div class="hole"><div style="width:96px;height:96px;border-radius:50%;background:var(--card)"></div></div>
    </div>
    <div class="legend">
      <div><i style="background:var(--verde)"></i>Activos &nbsp;<b style="color:var(--ink)">${activos}</b> (${p}%)</div>
      <div><i style="background:var(--naranja)"></i>Inactivos &nbsp;<b style="color:var(--ink)">${inactivos}</b> (${100 - p}%)</div>
    </div></div>`;
}
function bars(data) { // [{label,val,color}]
  const max = Math.max(1, ...data.map(d => d.val));
  return `<div class="bars">${data.map(d => `
    <div class="b"><div class="barra-v" style="height:${d.val / max * 100}%;background:${d.color}"></div>
    <b style="font-size:14px">${d.val}</b><small>${esc(d.label)}</small></div>`).join('')}</div>`;
}
function pie(porEtapa) {
  const cols = { Prospecto:'var(--azul)', Activo:'var(--verde)', Frecuente:'var(--morado)', Inactivo:'var(--faint)' };
  const entradas = Object.entries(porEtapa);
  const total = entradas.reduce((s, [, v]) => s + v, 0) || 1;
  let acc = 0, segs = [];
  entradas.forEach(([k, v]) => { const a = acc / total * 100, b = (acc + v) / total * 100; segs.push(`${cols[k]} ${a}% ${b}%`); acc += v; });
  return `<div class="charts">
    <div class="donut" style="background:conic-gradient(${segs.join(',')})"></div>
    <div class="legend">${entradas.map(([k, v]) => `<div><i style="background:${cols[k]}"></i>${k} &nbsp;<b style="color:var(--ink)">${v}</b></div>`).join('')}</div></div>`;
}

// --- Vista: Dashboard ---
async function dashboardView() {
  const m = await api('metricas.php');
  $('#vista-dashboard').innerHTML = `
    <h1>Resumen CRM</h1><p class="sub">Vista general de tus indicadores</p>
    <div class="kpis">
      <div class="kpi"><div class="lbl">Total de clientes</div><div class="num">${m.total}</div><div class="foot">Todos los clientes</div></div>
      <div class="kpi"><div class="lbl">Clientes activos</div><div class="num v">${m.activos}</div><div class="foot">${Math.round(m.activos/(m.total||1)*100)}% del total</div></div>
      <div class="kpi"><div class="lbl">Interacciones (mes)</div><div class="num">${m.interacciones_mes}</div><div class="foot">Este mes</div></div>
      <div class="kpi"><div class="lbl">Clientes sin interacción</div><div class="num n">${m.en_riesgo.length}</div><div class="foot">Últimos 30 días</div></div>
    </div>
    <div class="grid2">
      <div class="card"><h3>Clientes activos vs inactivos</h3>${donut(m.activos, m.inactivos)}</div>
      <div class="card"><h3>Clientes en riesgo</h3><div class="riesgo">${
        m.en_riesgo.length ? m.en_riesgo.map(r => `<div class="r"><span>${esc(r.nombre)}</span><small>${r.dias == null ? 'Sin interacción' : 'Hace ' + r.dias + ' días'}</small></div>`).join('')
        : '<p class="sub">Sin clientes en riesgo.</p>'}</div></div>
    </div>`;
}

// --- Vista: Clientes ---
let _clientes = [];
async function clientesView() {
  $('#vista-clientes').innerHTML = `
    <h1>Clientes</h1><p class="sub">Listado, búsqueda y filtro de clientes</p>
    <div class="barra">
      <input id="buscar" placeholder="Buscar por nombre, correo o empresa">
      <select id="fEstado"><option value="">Todos los estados</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>
      <select id="fEtapa"><option value="">Todas las etapas</option><option>Prospecto</option><option>Activo</option><option>Frecuente</option><option>Inactivo</option></select>
      <div class="sp"></div>
      <button class="btn sm" id="btnNuevo">+ Nuevo cliente</button>
    </div>
    <div class="card" style="padding:0;overflow:auto"><table>
      <thead><tr><th>Nombre</th><th>Empresa</th><th>Correo</th><th>Teléfono</th><th>Etapa</th><th>Estado</th><th></th></tr></thead>
      <tbody id="tbodyCli"><tr><td colspan="7" class="sub" style="padding:18px">Cargando…</td></tr></tbody>
    </table></div>`;
  const cargar = async () => {
    const q = new URLSearchParams();
    if ($('#buscar').value) q.set('buscar', $('#buscar').value);
    if ($('#fEstado').value) q.set('estado', $('#fEstado').value);
    if ($('#fEtapa').value) q.set('etapa', $('#fEtapa').value);
    _clientes = await api('clientes.php?' + q.toString());
    $('#tbodyCli').innerHTML = _clientes.length ? _clientes.map(c => `
      <tr>
        <td><b>${esc(c.nombre)}</b></td><td>${esc(c.empresa)}</td><td>${esc(c.correo)}</td><td>${esc(c.telefono)}</td>
        <td>${pill(c.etapa_crm)}</td><td>${estadoTxt(c.estado)}</td>
        <td style="white-space:nowrap">
          <span class="acc" onclick="mostrar('detalle',${c.id})" title="Ver">Ver</span>
          <span class="acc" onclick="modalCliente(${c.id})" title="Editar">Editar</span>
          <span class="acc" onclick="borrarCliente(${c.id})" title="Borrar">Borrar</span>
        </td>
      </tr>`).join('') : '<tr><td colspan="7" class="sub" style="padding:18px">Sin clientes.</td></tr>';
  };
  $('#buscar').oninput = cargar; $('#fEstado').onchange = cargar; $('#fEtapa').onchange = cargar;
  $('#btnNuevo').onclick = () => modalCliente();
  cargar();
}
async function borrarCliente(id) {
  if (!confirm('¿Borrar este cliente?')) return;
  await api('clientes.php?id=' + id, 'DELETE'); clientesView();
}

// --- Vista: Detalle de cliente ---
async function detalleView(id) {
  const c = await api('clientes.php?id=' + id);
  const hist = await api('interacciones.php?cliente_id=' + id);
  const ev = await api('evaluaciones.php?cliente_id=' + id);
  const icoTxt = { llamada:'L', correo:'C', reunion:'R' };
  $('#vista-detalle').innerHTML = `
    <span class="volver" onclick="mostrar('clientes')">← Volver a clientes</span>
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h1 style="margin:0">${esc(c.nombre)} &nbsp;${pill(c.etapa_crm)}</h1>
        <div><button class="btn ghost sm" onclick='modalEtapa(${JSON.stringify({id:c.id,etapa_crm:c.etapa_crm})})'>Cambiar etapa</button></div>
      </div>
      <div class="detalle-info">
        <div><div class="lbl">Empresa</div>${esc(c.empresa)||'—'}</div>
        <div><div class="lbl">Estado</div>${estadoTxt(c.estado)}</div>
        <div><div class="lbl">Correo</div>${esc(c.correo)||'—'}</div>
        <div><div class="lbl">Teléfono</div>${esc(c.telefono)||'—'}</div>
        <div><div class="lbl">Fecha de registro</div>${fmtFecha(c.fecha_registro)}</div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">Historial de interacciones</h3>
        <button class="btn sm" onclick="modalInteraccion(${c.id})">+ Nueva interacción</button>
      </div>
      <div class="tl">${hist.length ? hist.map(i => `
        <div class="item"><div class="ic ic-${i.tipo}">${icoTxt[i.tipo]||'?'}</div>
          <div class="txt"><b>${i.tipo[0].toUpperCase()+i.tipo.slice(1)}</b><p>${esc(i.descripcion)}</p><p style="color:var(--faint)">Usuario: ${esc(i.usuario)}</p></div>
          <div class="fecha">${fmtFecha(i.fecha)}</div></div>`).join('') : '<p class="sub">Aún no hay interacciones.</p>'}</div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">Evaluaciones de la relación &nbsp;<span style="color:var(--naranja)">${estrellas(ev.promedio)}</span> <span style="color:var(--muted);font-weight:400;font-size:13px">${ev.promedio}/5</span></h3>
        <button class="btn sm" onclick="modalEvaluacion(${c.id})">+ Nueva evaluación</button>
      </div>
      ${ev.evaluaciones.length ? ev.evaluaciones.map(e => `
        <div style="display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--line)">
          <div><b style="color:var(--naranja)">${estrellas(e.puntuacion)}</b><p style="font-size:13px;color:var(--muted);margin-top:2px">${esc(e.comentario)}</p><p style="font-size:12px;color:var(--faint)">${esc(e.usuario)}</p></div>
          <div style="font-size:12px;color:var(--faint);white-space:nowrap">${fmtFecha(e.fecha)}</div>
        </div>`).join('') : '<p class="sub">Sin evaluaciones aún.</p>'}
    </div>`;
}

// --- Vista: Mi actividad ---
async function actividadView() {
  const acts = await api('interacciones.php?usuario_id=' + USER.id);
  $('#vista-actividad').innerHTML = `
    <h1>Mi actividad</h1><p class="sub">Interacciones que has registrado</p>
    <div class="card" style="padding:0;overflow:auto"><table>
      <thead><tr><th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Descripción</th></tr></thead>
      <tbody>${acts.length ? acts.map(a => `<tr><td>${fmtFecha(a.fecha)}</td><td><b>${esc(a.cliente)}</b></td><td>${esc(a.tipo)}</td><td>${esc(a.descripcion)}</td></tr>`).join('')
        : '<tr><td colspan="4" class="sub" style="padding:18px">Sin actividad.</td></tr>'}</tbody>
    </table></div>`;
}

// --- Vista: Reportes ---
async function reportesView() {
  const m = await api('metricas.php');
  $('#vista-reportes').innerHTML = `
    <h1>Reportes y métricas</h1><p class="sub">Indicadores para evaluar el desempeño del CRM</p>
    <div class="kpis">
      <div class="kpi"><div class="lbl">Total de clientes</div><div class="num">${m.total}</div></div>
      <div class="kpi"><div class="lbl">Clientes activos</div><div class="num v">${m.activos}</div></div>
      <div class="kpi"><div class="lbl">Interacciones (mes)</div><div class="num">${m.interacciones_mes}</div></div>
      <div class="kpi"><div class="lbl">En riesgo</div><div class="num n">${m.en_riesgo.length}</div></div>
    </div>
    <div class="grid2">
      <div class="card"><h3>Interacciones por tipo</h3>${bars([
        {label:'Llamada',val:m.por_tipo.llamada,color:'var(--verde)'},
        {label:'Correo',val:m.por_tipo.correo,color:'var(--azul)'},
        {label:'Reunión',val:m.por_tipo.reunion,color:'var(--morado)'},
      ])}</div>
      <div class="card"><h3>Clientes por etapa CRM</h3>${pie(m.por_etapa)}</div>
    </div>`;
}

// --- Modales ---
function cerrarModal() { $('#modal-root').innerHTML = ''; }
function modalCliente(id) {
  const c = id ? _clientes.find(x => x.id == id) || {} : {};
  $('#modal-root').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)cerrarModal()"><div class="modal">
    <h3>${id ? 'Editar cliente' : 'Nuevo cliente'}</h3>
    <label>Nombre</label><input id="m_nombre" value="${esc(c.nombre)}">
    <div class="row"><div><label>Correo</label><input id="m_correo" value="${esc(c.correo)}"></div>
      <div><label>Teléfono</label><input id="m_tel" value="${esc(c.telefono)}"></div></div>
    <label>Empresa</label><input id="m_empresa" value="${esc(c.empresa)}">
    <div class="row"><div><label>Estado</label><select id="m_estado">
        <option value="activo"${c.estado==='activo'?' selected':''}>Activo</option>
        <option value="inactivo"${c.estado==='inactivo'?' selected':''}>Inactivo</option></select></div>
      <div><label>Etapa</label><select id="m_etapa">${['Prospecto','Activo','Frecuente','Inactivo'].map(e=>`<option${c.etapa_crm===e?' selected':''}>${e}</option>`).join('')}</select></div></div>
    <div class="actions"><button class="btn ghost sm" onclick="cerrarModal()">Cancelar</button>
      <button class="btn sm" onclick="guardarCliente(${id||0})">Guardar</button></div>
  </div></div>`;
}
async function guardarCliente(id) {
  const data = { nombre:$('#m_nombre').value, correo:$('#m_correo').value, telefono:$('#m_tel').value,
    empresa:$('#m_empresa').value, estado:$('#m_estado').value, etapa_crm:$('#m_etapa').value };
  if (!data.nombre.trim()) { alert('El nombre es obligatorio'); return; }
  if (id) await api('clientes.php?id=' + id, 'PUT', data);
  else    await api('clientes.php', 'POST', data);
  cerrarModal(); clientesView();
}
function modalInteraccion(clienteId) {
  $('#modal-root').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)cerrarModal()"><div class="modal">
    <h3>Nueva interacción</h3>
    <label>Tipo de interacción</label><select id="i_tipo"><option value="llamada">Llamada</option><option value="correo">Correo</option><option value="reunion">Reunión</option></select>
    <label>Descripción</label><textarea id="i_desc" rows="3"></textarea>
    <div class="actions"><button class="btn ghost sm" onclick="cerrarModal()">Cancelar</button>
      <button class="btn sm" onclick="guardarInteraccion(${clienteId})">Guardar</button></div>
  </div></div>`;
}
async function guardarInteraccion(clienteId) {
  await api('interacciones.php', 'POST', { cliente_id:clienteId, usuario_id:USER.id, tipo:$('#i_tipo').value, descripcion:$('#i_desc').value });
  cerrarModal(); detalleView(clienteId);
}
function modalEtapa(c) {
  $('#modal-root').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)cerrarModal()"><div class="modal">
    <h3>Editar etapa CRM</h3><p class="sub">Nueva etapa del cliente</p>
    <label>Etapa</label><select id="et_val">${['Prospecto','Activo','Frecuente','Inactivo'].map(e=>`<option${c.etapa_crm===e?' selected':''}>${e}</option>`).join('')}</select>
    <div class="actions"><button class="btn ghost sm" onclick="cerrarModal()">Cancelar</button>
      <button class="btn sm" onclick="guardarEtapa(${c.id})">Guardar cambios</button></div>
  </div></div>`;
}
async function guardarEtapa(id) {
  await api('clientes.php?id=' + id + '&accion=etapa', 'PUT', { etapa_crm:$('#et_val').value });
  cerrarModal(); detalleView(id);
}
function modalEvaluacion(clienteId) {
  $('#modal-root').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)cerrarModal()"><div class="modal">
    <h3>Nueva evaluación</h3>
    <label>Puntuación</label>
    <select id="ev_p"><option value="5">5 — Excelente</option><option value="4">4 — Buena</option><option value="3">3 — Regular</option><option value="2">2 — Baja</option><option value="1">1 — Mala</option></select>
    <label>Comentario</label><textarea id="ev_c" rows="3" placeholder="¿Cómo va la relación con este cliente?"></textarea>
    <div class="actions"><button class="btn ghost sm" onclick="cerrarModal()">Cancelar</button>
      <button class="btn sm" onclick="guardarEvaluacion(${clienteId})">Guardar</button></div>
  </div></div>`;
}
async function guardarEvaluacion(clienteId) {
  await api('evaluaciones.php', 'POST', { cliente_id:clienteId, usuario_id:USER.id, puntuacion:+$('#ev_p').value, comentario:$('#ev_c').value });
  cerrarModal(); detalleView(clienteId);
}

// arranque
mostrar('dashboard');
