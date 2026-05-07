const dropdown = document.getElementById("teamsDropdown")
const container = document.getElementById("trainingContainer")
const resultado = document.getElementById("resultado")
const btnEnviar = document.getElementById("btnEnviar")

let equiposData = []
let jugadoresPorEquipo = {} // Cache de jugadores


const tiposEntreno = [
  { texto: "Regate", value: "rg" },
  { texto: "Tiro", value: "ti" },
  { texto: "Defensa", value: "df" },
  { texto: "Pase", value: "ps" },
  { texto: "Porteria", value: "po" }
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
    
    // Saltar primeras 2 líneas (header)
    const lineas = texto.split('\n').slice(2)
    
    return lineas
      .filter(linea => linea.trim())
      .map(linea => {
        const partes = linea.trim().split(/\s+/)
        return partes[0] // Solo el nombre (primera columna)
      })
      .filter(nombre => nombre) // Filtrar vacíos
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
	  ${tiposEntreno.map(t => `<option value="${t.value}">${t.texto}</option>`).join("")}
        </select>
      </div>
    `
    container.appendChild(div)
  }
}

/* =========================
   CAMBIO DE EQUIPO - CORREGIDO
========================= */
dropdown.onchange = async () => {
  const equipoId = dropdown.value

  // Sin equipo → limpiar
  if(!equipoId) {
    container.innerHTML = ""
    return
  }

  const equipo = equiposData.find(e => e.id === equipoId)
  if(!equipo) return

  // Crear estructura
  crearEntrenamientos()
  loadingMsg.style.display = "block"
  loadingMsg.innerText = "📥 Cargando jugadores del equipo..."

  try {
    // ¿Ya tenemos cache?
    if (!jugadoresPorEquipo[equipoId]) {
      loadingMsg.innerText = "🌐 Descargando lista de jugadores..."
      const jugadores = await cargarJugadoresDropbox(equipo.dropbox_dir)
      jugadoresPorEquipo[equipoId] = jugadores
    }

    const players = jugadoresPorEquipo[equipoId]

    // Rellenar TODOS los dropdowns
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
    setTimeout(() => {
      loadingMsg.style.display = "none"
    }, 1500)

  } catch (error) {
    console.error('Error:', error)
    loadingMsg.innerText = "❌ Error cargando jugadores"
    setTimeout(() => {
      loadingMsg.style.display = "none"
    }, 2000)
  }
}

/* =========================
   ENVIAR DATOS A API
========================= */
btnEnviar.onclick = async () => {
  const equipoId = dropdown.value
  if(!equipoId) {
    alert("⚠️ Selecciona un equipo primero")
    return
  }

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

  if (hayErrores) {
    alert("⚠️ Completa TODOS los entrenamientos")
    return
  }

  // 🔥 LOGS COMPLETOS PARA DEBUG
  console.log('🔥 === DEBUG API ===')
  console.log('Equipo ID:', equipoId)
  console.log('Entrenamientos:', entrenamientos)
  console.log('Payload completo:')
  console.log(JSON.stringify({
    equipo: equipoId,
    entrenamientos
  }, null, 2))
  console.log('====================')

  resultado.innerHTML = "🔄 Enviando..."

  try {
    const res = await fetch("https://esmsubed.duckdns.org/api/training", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        equipo: equipoId,
        entrenamientos
      })
    })

    const data = await res.json()

    // 🔥 LOG RESPUESTA - CORREGIDO
    console.log('📡 Respuesta API:', data)
    console.log('Status:', res.status, res.statusText)  // ✅ PARÉNTESIS CORREGIDOS

    if(res.ok) {
      resultado.innerHTML = `<div style="color:#10b981;font-weight:bold;">✔️ Entrenamiento guardado correctamente</div>`
      // Reset form
      dropdown.value = ""
      container.innerHTML = ""
    } else {
      resultado.innerHTML = `<div style="color:#ef4444;">❌ ${data.error || "Error desconocido"}</div>`
    }
  } catch(e) {
    console.error('💥 Error completo:', e)
    resultado.innerHTML = `<div style="color:#ef4444;">❌ Error de conexión: ${e.message}</div>`
  }
}
