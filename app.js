let token = '';
let listaActual = [];
let listasGuardadas = {};
let tablaActual = 'chedraui';
let currentListId = null; 


function mostrarRegistro() {
  document.getElementById('registroForm').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
}


function mostrarLogin() {
  document.getElementById('registroForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}


async function registrarUsuario() {
  const nombre_usuario = document.getElementById('regNombreUsuario').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const contrasena = document.getElementById('regContrasena').value;

  if (!nombre_usuario || !email || !contrasena) {
    alert('Todos los campos son obligatorios');
    return;
  }

  try {
    const response = await fetch('https://smartprice-backend-1.onrender.com/api/usuarios/registro', {
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

async function iniciarSesion() {
  const email = document.getElementById('loginEmail').value.trim();
  const contrasena = document.getElementById('loginContrasena').value;

  if (!email || !contrasena) {
    alert('Todos los campos son obligatorios');
    return;
  }

  try {
    const response = await fetch('https://smartprice-backend-1.onrender.com/api/usuarios/login', {
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
  resetearListaActual();
 
}

// Cargar token al iniciar
window.onload = function() {
  token = localStorage.getItem('token');
  if (token) {
    mostrarAplicacion();
    obtenerProductos();
    
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
    const response = await fetch('https://smartprice-backend-1.onrender.com/api/productos');
    productos = await response.json();
  } catch (error) {
    console.error('Error al cargar los productos:', error);
  }
}

// Autocompletado
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

async function agregarAlCarrito() {
  if (!currentListId) {
    alert('Por favor, selecciona una lista para agregar productos.');
    return;
  }

  const nombreProducto = document.getElementById('productDisplayName').textContent;
  const precioChedraui = parseFloat(document.getElementById('productDisplayPriceChedraui').textContent);
  const precioHeb = parseFloat(document.getElementById('productDisplayPriceHeb').textContent);
  const cantidad = parseInt(document.getElementById('quantity').value);
  
  if (cantidad < 1) {
    alert('La cantidad debe ser al menos 1');
    return;
  }

  const producto = productos.find(p => p.nombre === nombreProducto);
  if (!producto) {
    alert('Producto no encontrado en la base de datos.');
    return;
  }

  try {
    // Agregar el item al backend
    const response = await fetch('https://smartprice-backend-1.onrender.com/api/items', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lista_id: currentListId, producto_id: producto.id, cantidad: cantidad })
    });

    const data = await response.json();

    if (response.ok) {
      // Actualizar la lista actual en el frontend
      const itemExistente = listaActual.find(item => item.nombre === nombreProducto);
      if (itemExistente) {
        itemExistente.cantidad += cantidad;
        itemExistente.totalChedraui = itemExistente.precioChedraui * itemExistente.cantidad;
        itemExistente.totalHeb = itemExistente.precioHeb * itemExistente.cantidad;
      } else {
        const itemCarrito = {
          id: data.itemId, // ID del item en el backend
          nombre: nombreProducto,
          precioChedraui: precioChedraui,
          cantidad: cantidad,
          totalChedraui: precioChedraui * cantidad,
          precioHeb: precioHeb,
          totalHeb: precioHeb * cantidad
        };
        listaActual.push(itemCarrito);
      }
      
      mostrarLista();
      document.getElementById('productDetails').style.display = 'none';
      document.getElementById('productName').value = '';
      habilitarBotonComparar();
      ocultarResultadosComparacion();
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    alert('Error al agregar el producto al carrito');
  }
}


function mostrarLista() {
  const listaElement = document.getElementById('shoppingList');
  listaElement.innerHTML = '';
  listaActual.forEach((item, indice) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.nombre} (Cantidad: ${item.cantidad})
      <span class="delete-icon" onclick="eliminarItemDeLista(${item.id})">🗑️</span>
    `;
    listaElement.appendChild(li);
  });
}


function habilitarBotonComparar() {
  const botonComparar = document.getElementById('compareButton');
  if (listaActual.length > 0) {
    botonComparar.disabled = false;
  } else {
    botonComparar.disabled = true;
  }
}


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
  document.getElementById('saveListDialogTitle').textContent = 'Guardar Nueva Lista';
  document.getElementById('listName').value = '';
}

// Guardar la lista (crear nueva)
async function guardarLista() {
  const nombreLista = document.getElementById('listName').value.trim();
  if (nombreLista === '') {
    alert('Por favor, ingresa un nombre para la lista.');
    return;
  }

  try {
    const response = await fetch('https://smartprice-backend-1.onrender.com/api/listas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre: nombreLista })
    });

    const data = await response.json();

    if (response.ok) {
      currentListId = data.listaId;
      document.getElementById('currentListName').textContent = nombreLista;
      alert('Lista creada exitosamente. Ahora puedes agregar productos a la lista.');
      ocultarDialogoGuardarLista();
      cargarListasGuardadas();
    } else {
      alert(data.mensaje);
    }
    listaActual=[];
    mostrarLista();
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar la lista');
  }
}


async function editarNombreLista(idLista, nuevoNombre) {
  if (!nuevoNombre) {
    alert('El nombre de la lista no puede estar vacío.');
    return;
  }

  try {
    const response = await fetch(`https://smartprice-backend-1.onrender.com/api/listas/${idLista}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre: nuevoNombre })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Nombre de la lista actualizado exitosamente.');
      cargarListasGuardadas();
      if (currentListId === idLista) {
        document.getElementById('currentListName').textContent = nuevoNombre;
      }
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error('Error al editar el nombre de la lista:', error);
    alert('Error al editar el nombre de la lista');
  }
}


async function eliminarLista(idLista){
  if (!confirm('¿Estás seguro de que deseas eliminar esta lista?')) return;

  try {
    const response = await fetch(`https://smartprice-backend-1.onrender.com/api/listas/${idLista}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      method:'DELETE' 
    });
    
    const data = await response.json();

    if (response.ok) {
      alert('Lista eliminada exitosamente');
      cargarListasGuardadas();
      // Si la lista eliminada es la actual, limpiar la vista
      if (currentListId === idLista) {
        currentListId = null;
        listaActual = [];
        mostrarLista();
        document.getElementById('currentListName').textContent = 'Mi Lista de Compras';
        habilitarBotonComparar();
        ocultarResultadosComparacion();
      }
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error('Error al intentar eliminar la lista:', error);
    alert('Error al eliminar la lista');
  }
}


async function cargarListasGuardadas() {
  try {
    const response = await fetch('https://smartprice-backend-1.onrender.com/api/listas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listas = await response.json();
    const elementoListasGuardadas = document.getElementById('savedLists');
    elementoListasGuardadas.innerHTML = '';
    for (const lista of listas) {
      const li = document.createElement('li');
      
      // Crear un contenedor para el nombre y los iconos
      const nombreContainer = document.createElement('span');
      nombreContainer.textContent = lista.nombre;
      
      // Crear contenedor para los iconos
      const iconosContainer = document.createElement('div');
      iconosContainer.classList.add('iconos-container');
      
      // Icono de Editar
      const iconoEditar = document.createElement('span');
      iconoEditar.classList.add('edit-icon');
      iconoEditar.textContent = '✏️';
      iconoEditar.onclick = (e) => {
        e.stopPropagation();
        const nuevoNombre = prompt('Ingresa el nuevo nombre de la lista:', lista.nombre);
        if (nuevoNombre !== null && nuevoNombre.trim() !== '') { // Validar que no esté vacío
          editarNombreLista(lista.id, nuevoNombre.trim());
        }
      };
      
      // Icono de Eliminar
      const iconoEliminar = document.createElement('span');
      iconoEliminar.classList.add('delete-icon');
      iconoEliminar.textContent = '🗑️';
      iconoEliminar.onclick = (e) => {
        e.stopPropagation();
        eliminarLista(lista.id);
      };
      
      // Agregar iconos al contenedor de iconos
      iconosContainer.appendChild(iconoEditar);
      iconosContainer.appendChild(iconoEliminar);
      
      
      li.appendChild(nombreContainer);
      li.appendChild(iconosContainer);
      
      
      li.onclick = () => cargarLista(lista.id, lista.nombre);
      
      // Agregar el elemento li a la lista de listas guardadas
      elementoListasGuardadas.appendChild(li);
    }
  } catch (error) {
    console.error('Error al cargar las listas:', error);
    alert('Error al cargar las listas');
  }
}


async function cargarLista(idLista, nombreLista) {
  try {
    const response = await fetch(`https://smartprice-backend-1.onrender.com/api/items/${idLista}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const items = await response.json();
    listaActual = items.map(item => ({
      id: item.id, // ID del item en el backend
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
    currentListId = idLista;
    document.getElementById('currentListName').textContent = nombreLista;
  } catch (error) {
    console.error('Error al cargar la lista:', error);
    alert('Error al cargar la lista');
  }
}


async function eliminarItemDeLista(idItem) {
  if (!currentListId) {
    alert('No hay una lista seleccionada.');
    return;
  }

  if (!confirm('¿Estás seguro de que deseas eliminar este producto de la lista?')) return;

  try {
    const response = await fetch(`https://smartprice-backend-1.onrender.com/api/items/${idItem}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      // Actualizar la listaActual en el frontend
      listaActual = listaActual.filter(item => item.id !== idItem);
      mostrarLista();
      habilitarBotonComparar();
      ocultarResultadosComparacion();
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error('Error al eliminar el item:', error);
    alert('Error al eliminar el producto de la lista');
  }
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

  
  const resultadosComparacion = document.getElementById('comparisonResults');
  resultadosComparacion.style.display = 'block';

  // Inicializar la visualización de tablas
  mostrarTablaChedraui();
}


function ocultarResultadosComparacion() {
  document.getElementById('comparisonResults').style.display = 'none';
}


function ocultarDialogoGuardarLista() {
  document.getElementById('saveListDialog').style.display = 'none';
}


function resetearListaActual() {
  listaActual = [];
  mostrarLista();
  habilitarBotonComparar();
  ocultarResultadosComparacion();
}
