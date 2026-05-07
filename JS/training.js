const dropdown = document.getElementById("teamsDropdown")
const container = document.getElementById("trainingContainer")
const resultado = document.getElementById("resultado")
const btnEnviar = document.getElementById("btnEnviar")

// ⭐ MODAL PIN
const modal = document.getElementById("pinModal")
const confirmPin = document.getElementById("confirmPin")
const cancelPin = document.getElementById("cancelPin")
const pinError = document.getElementById("pinError")
const teamPinInput = document.getElementById("teamPin")

let equiposData = []
let jugadoresPorEquipo = {}
let entrenamientosData = []  // ⭐ Guardar datos antes del modal

const tiposEntreno = [
  "Regate (rg)", "Tiro (ti)", "Defensa (df)", "Pase (ps)", "Porteria (po)"
]

/* =========================
   LOADING MSG
========================= */
const loadingMsg = document.createElement("div")
loadingMsg.style.margin = "10px 0"
loadingMsg.style.color = "#666"
loadingMsg.style.display = "none"
loadingMsg.innerText = "🔄 Cargando jugadores..."
container.parentNode.insertBefore(loadingMsg, container)

/* =========================
   CARGAR EQUIPOS
========================= */
fetch('./JS/teams.json')
.then(r => r.json())
.then(equipos => {
  equiposData = equipos
  equipos.forEach(e => {
    const opt = document.createElement("option")
    opt.value = e.id
    opt.textContent = e.team
    dropdown.appendChild(opt)
  })
})
.catch(err => console.error('Error cargando equipos:', err))

/* =========================
   PARSEAR JUGADORES DESDE DROPBOX
========================= */
async function cargarJugadoresDropbox(dropboxUrl) {
  try {
    const response = await fetch(dropboxUrl)
    const texto = await response.text()
    const lineas = texto.split('\n').slice(2)
    return lineas
      .filter(linea => linea.trim())
      .map(linea => {
        const partes = linea.trim().split(/\s+/)
        return partes[0]
      })
      .filter(nombre => nombre)
  } catch (error) {
    console.error('Error cargando jugadores de Dropbox:', dropboxUrl, error)
    return []
  }
}

/* =========================
   CREAR ENTRENAMIENTOS
========================= */
function crearEntrenamientos() {
  container.innerHTML = ""
  for(let i = 1; i <= 5; i++) {
    const div = document.createElement("div")
    div.className = "training-block"
    div.innerHTML = `
      <h3>Entrenamiento ${i}</h3>
      <div class="training-row">
        <select id="jugador_${i}">
          <option value="">-- Jugador --</option>
        </select>
        <select id="tipo_${i}">
          <option value="">-- Tipo --</option>
          ${tiposEntreno.map(t => {
            const [texto, value] = t.split('(')
            const valor = value ? value.slice(0, -1) : texto.trim()
            return `<option value="${valor}">${texto.trim()}</option>`
          }).join("")}
        </select>
      </div>
    `
    container.appendChild(div)
  }
}

/* =========================
   CAMBIO DE EQUIPO (igual)
========================= */
dropdown.onchange = async () => {
  const equipoId = dropdown.value
  if(!equipoId) {
    container.innerHTML = ""
    return
  }
  const equipo = equiposData.find(e => e.id === equipoId)
  if(!equipo) return

  crearEntrenamientos()
  loadingMsg.style.display = "block"
  loadingMsg.innerText = "📥 Cargando jugadores del equipo..."

  try {
    if (!jugadoresPorEquipo[equipoId]) {
      const jugadores = await cargarJugadoresDropbox(equipo.dropbox_dir)
      jugadoresPorEquipo[equipoId] = jugadores
    }
    const players = jugadoresPorEquipo[equipoId]
    for(let i = 1; i <= 5; i++) {
      const jugadorSelect = document.getElementById(`jugador_${i}`)
      jugadorSelect.innerHTML = `<option value="">-- Selecciona jugador --</option>`
      players.forEach(nombre => {
        const opt = document.createElement("option")
        opt.value = nombre
        opt.textContent = nombre
        jugadorSelect.appendChild(opt)
      })
    }
    loadingMsg.innerText = `✅ ${players.length} jugadores cargados`
    setTimeout(() => loadingMsg.style.display = "none", 1500)
  } catch (error) {
    console.error('Error:', error)
    loadingMsg.innerText = "❌ Error cargando jugadores"
    setTimeout(() => loadingMsg.style.display = "none", 2000)
  }
}

/* =========================
   ⭐ VALIDAR Y GUARDAR DATOS ANTES MODAL
========================= */
function validarEntrenamientos() {
  const equipoId = dropdown.value
  if(!equipoId) return { ok: false, error: "Selecciona un equipo" }

  const entrenamientos = []
  let hayErrores = false

  for(let i = 1; i <= 5; i++) {
    const jugador = document.getElementById(`jugador_${i}`).value
    const tipo = document.getElementById(`tipo_${i}`).value
    if (!jugador || !tipo) {
      hayErrores = true
      break
    }
    entrenamientos.push({ jugador, tipo })
  }

  if (hayErrores) return { ok: false, error: "Completa TODOS los entrenamientos" }

  return { 
    ok: true, 
    equipo: equipoId, 
    entrenamientos 
  }
}

/* =========================
   ⭐ BTN ENVIAR - MUESTRA MODAL
========================= */
btnEnviar.onclick = () => {
  const validacion = validarEntrenamientos()
  
  if(!validacion.ok) {
    alert(`⚠️ ${validacion.error}`)
    return
  }

  // ⭐ GUARDAR DATOS PARA DESPUÉS DEL MODAL
  entrenamientosData = validacion
  
  // ⭐ MOSTRAR MODAL PIN
  teamPinInput.value = ""
  pinError.innerText = ""
  modal.style.display = "flex"
}

/* =========================
   CANCELAR MODAL
========================= */
cancelPin.onclick = () => {
  modal.style.display = "none"
  entrenamientosData = []  // Limpiar datos
}

/* =========================
   ⭐ CONFIRMAR PIN - ENVIAR A API
========================= */
confirmPin.onclick = async () => {
  const pin = teamPinInput.value.trim()
  
  if(!pin) {
    pinError.innerText = "Introduce el PIN del equipo"
    return
  }

  // ⭐ ENVIAR CON PIN
  const payload = {
    equipo: entrenamientosData.equipo,
    entrenamientos: entrenamientosData.entrenamientos,
    pin: pin
  }

  console.log('🔥 Enviando:', payload)

  modal.style.display = "none"
  resultado.innerHTML = "🔄 Enviando..."

  try {
    const res = await fetch("https://esmsubed.duckdns.org/api/training", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    console.log('📡 Respuesta:', data)

    if(res.ok) {
      resultado.innerHTML = `<div style="color:#10b981;font-weight:bold;">✔️ ${data.message}<br><small>${data.archivo}</small></div>`
      // Reset completo
      setTimeout(() => {
        dropdown.value = ""
        container.innerHTML = ""
        resultado.innerHTML = ""
        entrenamientosData = []
      }, 2000)
    } else {
      resultado.innerHTML = `<div style="color:#ef4444;">❌ ${data.error || "Error desconocido"}</div>`
    }
  } catch(e) {
    console.error('💥 Error:', e)
    resultado.innerHTML = `<div style="color:#ef4444;">❌ Error conexión: ${e.message}</div>`
  }
}
