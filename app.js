
let token = '';
let listaActual = [];
let listasGuardadas = {};
let tablaActual = 'chedraui';

// Mostrar formulario de registro
function mostrarRegistro() {
  document.getElementById('registroForm').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
}

// Mostrar formulario de login
function mostrarLogin() {
  document.getElementById('registroForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

// Registrar usuario
async function registrarUsuario() {
  const nombre_usuario = document.getElementById('regNombreUsuario').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const contrasena = document.getElementById('regContrasena').value;

  if (!nombre_usuario || !email || !contrasena) {
    alert('Todos los campos son obligatorios');
    return;
  }

  try {
    const response = await fetch('https://smartprice-backend-production.up.railway.app/api/usuarios/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_usuario, email, contrasena })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.mensaje);
      mostrarLogin();
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al registrar el usuario');
  }
}

// Iniciar sesión
async function iniciarSesion() {
  const email = document.getElementById('loginEmail').value.trim();
  const contrasena = document.getElementById('loginContrasena').value;

  if (!email || !contrasena) {
    alert('Todos los campos son obligatorios');
    return;
  }

  try {
    const response = await fetch('https://smartprice-backend-production.up.railway.app/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json','Access-Control-Allow-Origin':'https://elgoatdelcode.github.io/' },
      body: JSON.stringify({ email, contrasena })
    });

    const data = await response.json();

    if (response.ok) {
      token = data.token;
      localStorage.setItem('token', token);
      mostrarAplicacion();
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al iniciar sesión');
  }
}


function mostrarAplicacion() {
  document.querySelector('.auth-container').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  cargarListasGuardadas();
}

// Cargar token al iniciar
window.onload = function() {
  token = localStorage.getItem('token');
  if (token) {
    mostrarAplicacion();
  }
};


function cerrarSesion() {
  token = '';
  localStorage.removeItem('token');
  document.getElementById('app').style.display = 'none';
  document.querySelector('.auth-container').style.display = 'block';
}


let productos = [];
let sugerenciasActuales = [];

// Obtener datos de productos desde el backend
async function obtenerProductos() {
  try {
    const response = await fetch('https://smartprice-backend-production.up.railway.app/api/productos');
    productos = await response.json();
  } catch (error) {
    console.error('Error al cargar los productos:', error);
  }
}
//autocompletado
function mostrarSugerencias() {
  const input = document.getElementById('productName').value.toLowerCase();
  const contenedorSugerencias = document.getElementById('autocompleteSuggestions');
  contenedorSugerencias.innerHTML = '';
  if (!input) {
    contenedorSugerencias.style.display = 'none';
    return;
  }
  const productosUnicos = new Set();
  sugerenciasActuales = productos.filter(producto => {
    const esCoincidencia = producto.nombre.toLowerCase().includes(input);
    if (esCoincidencia && !productosUnicos.has(producto.nombre)) {
      productosUnicos.add(producto.nombre);
      return true;
    }
    return false;
  });
  if (sugerenciasActuales.length > 0) {
    contenedorSugerencias.style.display = 'block';
    sugerenciasActuales.forEach(producto => {
      const itemSugerencia = document.createElement('div');
      itemSugerencia.classList.add('autocomplete-suggestion');
      itemSugerencia.textContent = producto.nombre;
      itemSugerencia.onclick = () => seleccionarSugerencia(producto);
      contenedorSugerencias.appendChild(itemSugerencia);
    });
  } else {
    contenedorSugerencias.style.display = 'none';
  }
}


function seleccionarSugerencia(producto) {
  document.getElementById('productName').value = producto.nombre;
  document.getElementById('autocompleteSuggestions').style.display = 'none';
}


function buscarProducto() {
  const nombreProducto = document.getElementById('productName').value.toLowerCase();
  const producto = productos.find(p => p.nombre.toLowerCase() === nombreProducto);
  if (producto) {
    document.getElementById('productDisplayName').textContent = producto.nombre;
    document.getElementById('productDisplayPriceChedraui').textContent = parseFloat(producto.precio_chedraui).toFixed(2);
    document.getElementById('productDisplayPriceHeb').textContent = parseFloat(producto.precio_heb).toFixed(2);
    document.getElementById('productDisplayCode').textContent = producto.gtin;
    document.getElementById('productDetails').style.display = 'block';
  } else {
    alert('Producto no encontrado');
    document.getElementById('productDetails').style.display = 'none';
  }
}


function agregarAlCarrito() {
  const nombreProducto = document.getElementById('productDisplayName').textContent;
  const precioChedraui = parseFloat(document.getElementById('productDisplayPriceChedraui').textContent);
  const precioHeb = parseFloat(document.getElementById('productDisplayPriceHeb').textContent);
  const cantidad = parseInt(document.getElementById('quantity').value);
  const itemCarrito = {
    nombre: nombreProducto,
    precioChedraui: precioChedraui,
    cantidad: cantidad,
    totalChedraui: precioChedraui * cantidad,
    precioHeb: precioHeb,
    totalHeb: precioHeb * cantidad
  };
  listaActual.push(itemCarrito);
  mostrarLista();
  document.getElementById('productDetails').style.display = 'none';
  document.getElementById('productName').value = '';
  habilitarBotonComparar();
}

// Mostrar lista de compras
function mostrarLista() {
  const listaElement = document.getElementById('shoppingList');
  listaElement.innerHTML = '';
  listaActual.forEach((item, indice) => {
    const li = document.createElement('li');
    li.textContent = `${item.nombre} (Cantidad: ${item.cantidad})`;
    li.setAttribute('data-index', indice);
    const iconoEliminar = document.createElement('span');
    iconoEliminar.classList.add('delete-icon');
    iconoEliminar.textContent = '🗑️';
    iconoEliminar.onclick = () => eliminarItemDeLista(indice);
    li.appendChild(iconoEliminar);
    listaElement.appendChild(li);
  });
}

// Habilitar botón de comparar precios
function habilitarBotonComparar() {
  const botonComparar = document.getElementById('compareButton');
  if (listaActual.length > 0) {
    botonComparar.disabled = false;
  } else {
    botonComparar.disabled = true;
  }
}

// Generar tabla para Chedraui
function generarTablaChedraui() {
  const cuerpoTabla = document.getElementById('chedrauiTableBody');
  cuerpoTabla.innerHTML = '';
  let total = 0;
  listaActual.forEach(item => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.precioChedraui.toFixed(2)}</td>
      <td>$${item.totalChedraui.toFixed(2)}</td>
    `;
    cuerpoTabla.appendChild(fila);
    total += item.totalChedraui;
  });
  document.getElementById('chedrauiTotal').innerHTML = `<strong>Total en Chedraui: $${total.toFixed(2)}</strong>`;
  return total;
}

// Generar tabla para Heb
function generarTablaHeb() {
  const cuerpoTabla = document.getElementById('hebTableBody');
  cuerpoTabla.innerHTML = '';
  let total = 0;
  listaActual.forEach(item => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.precioHeb.toFixed(2)}</td>
      <td>$${item.totalHeb.toFixed(2)}</td>
    `;
    cuerpoTabla.appendChild(fila);
    total += item.totalHeb;
  });
  document.getElementById('hebTotal').innerHTML = `<strong>Total en Heb: $${total.toFixed(2)}</strong>`;
  return total;
}

// Comparar precios y mostrar recomendación
function compararPrecios() {
  const totalChedraui = generarTablaChedraui();
  const totalHeb = generarTablaHeb();

  let mensajeRecomendacion = '';
  if (totalChedraui < totalHeb) {
    const ahorro = (totalHeb - totalChedraui).toFixed(2);
    mensajeRecomendacion = `Recomendamos comprar en Chedraui. Ahorrará $${ahorro}.`;
  } else if (totalHeb < totalChedraui) {
    const ahorro = (totalChedraui - totalHeb).toFixed(2);
    mensajeRecomendacion = `Recomendamos comprar en Heb. Ahorrará $${ahorro}.`;
  } else {
    mensajeRecomendacion = `Ambos supermercados tienen el mismo costo total.`;
  }

  document.getElementById('recommendationMessage').innerHTML = mensajeRecomendacion;

  // Mostrar resultados de comparación
  const resultadosComparacion = document.getElementById('comparisonResults');
  resultadosComparacion.style.display = 'block';

  // Inicializar la visualización de tablas
  mostrarTablaChedraui();
}


function mostrarTablaAnterior() {
  if (tablaActual === 'heb') {
    document.getElementById('hebTableContainer').style.display = 'none';
    document.getElementById('chedrauiTableContainer').style.display = 'block';
    tablaActual = 'chedraui';
  }
}


function mostrarTablaSiguiente() {
  if (tablaActual === 'chedraui') {
    document.getElementById('chedrauiTableContainer').style.display = 'none';
    document.getElementById('hebTableContainer').style.display = 'block';
    tablaActual = 'heb';
  }
}


function mostrarTablaChedraui() {
  document.getElementById('chedrauiTableContainer').style.display = 'block';
  document.getElementById('hebTableContainer').style.display = 'none';
  tablaActual = 'chedraui';
}


function mostrarTablaHeb() {
  document.getElementById('chedrauiTableContainer').style.display = 'none';
  document.getElementById('hebTableContainer').style.display = 'block';
  tablaActual = 'heb';
}


function mostrarDialogoGuardarLista() {
  document.getElementById('saveListDialog').style.display = 'block';
}

// Guardar la lista 
async function guardarLista() {
  const nombreLista = document.getElementById('listName').value.trim();
  if (nombreLista === '') {
    alert('Por favor, ingresa un nombre para la lista.');
    return;
  }
  try {
    const response = await fetch('https://smartprice-backend-production.up.railway.app/api/listas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre: nombreLista })
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar los items en la lista
      for (const item of listaActual) {
        const producto = productos.find(p => p.nombre === item.nombre);
        if (producto) {
          await fetch('https://smartprice-backend-production.up.railway.app/api/items', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ lista_id: data.listaId, producto_id: producto.id, cantidad: item.cantidad })
          });
        }
      }
      alert('Lista guardada exitosamente');
      ocultarDialogoGuardarLista();
      listaActual = [];
      mostrarLista();
      habilitarBotonComparar();
      cargarListasGuardadas();
      ocultarResultadosComparacion();
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar la lista');
  }
}


function ocultarDialogoGuardarLista() {
  document.getElementById('saveListDialog').style.display = 'none';
}


async function cargarListasGuardadas() {
  try {
    const response = await fetch('https://smartprice-backend-production.up.railway.app/api/listas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listas = await response.json();
    const elementoListasGuardadas = document.getElementById('savedLists');
    elementoListasGuardadas.innerHTML = '';
    for (const lista of listas) {
      const li = document.createElement('li');
      li.textContent = lista.nombre;
      li.onclick = () => cargarLista(lista.id);
      elementoListasGuardadas.appendChild(li);
    }
  } catch (error) {
    console.error('Error al cargar las listas:', error);
  }
}

// Cargar una lista guardada
async function cargarLista(idLista) {
  try {
    const response = await fetch(`https://smartprice-backend-production.up.railway.app/api/items/${idLista}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const items = await response.json();
    listaActual = items.map(item => ({
      nombre: item.nombre,
      precioChedraui: parseFloat(item.precio_chedraui),
      precioHeb: parseFloat(item.precio_heb),
      cantidad: parseInt(item.cantidad),
      totalChedraui: parseFloat(item.precio_chedraui) * parseInt(item.cantidad),
      totalHeb: parseFloat(item.precio_heb) * parseInt(item.cantidad)
    }));
    mostrarLista();
    habilitarBotonComparar();
    ocultarResultadosComparacion();
  } catch (error) {
    console.error('Error al cargar la lista:', error);
    alert('Error al cargar la lista');
  }
}


function ocultarResultadosComparacion() {
  document.getElementById('comparisonResults').style.display = 'none';
}


function eliminarItemDeLista(indice) {
  listaActual.splice(indice, 1);
  mostrarLista();
  habilitarBotonComparar();
}


function guardarEnLocalStorage() {
  localStorage.setItem('listasGuardadas', JSON.stringify(listasGuardadas));
}

// Obtener datos al cargar
obtenerProductos();
