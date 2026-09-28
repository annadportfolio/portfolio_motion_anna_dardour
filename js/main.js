
// ---------------------------------------------------------------- constants

const WALL_RADIUS = 9
const WALL_HEIGHT = 4.1 // top of the straight wall, where the cove starts
const COVE_TOP = 5.0 // ceiling height, reached through the curved cove
const COVE_INNER_RADIUS = 6.8
const WELL_DEPTH = 0.4 // the whole crown above the cove is the light well
const EYE_HEIGHT = 1.65

const PANEL_COUNT = 8
const PANEL_HEIGHT = 2.3
const PANEL_WIDTH = PANEL_HEIGHT * (16 / 9)
const PANEL_CENTER_Y = 2.05
const PANEL_RADIUS = WALL_RADIUS - 0.06

// Anna's works, hung in room order.
// file  = fichier vidéo local (à placer dans le dossier videos/)
// vimeo = lien Vimeo d'origine (conservé pour mémoire, non utilisé par la galerie)
const PROJECTS = [
  { file: 'videos/01_never_again.mp4', vimeo: 'https://vimeo.com/1211331162', title: 'Never Again', meta: '2026 — vidéo' },
  { file: 'videos/02_la_mouche.mp4', vimeo: 'https://vimeo.com/1211337517', title: 'La Mouche', meta: '2025 — vidéo' },
  { file: 'videos/03_la_greve_des_xenobots.mp4', vimeo: 'https://vimeo.com/1211359519', title: 'La grève des Xénobots', meta: '2025 — vidéo' },
  { file: 'videos/04_aide_moi.mp4', vimeo: 'https://vimeo.com/1211365345', title: 'Aide-moi', meta: '2026 — clip' },
  { file: 'videos/05_tucupi.mp4', vimeo: 'https://vimeo.com/1211373822', title: 'Tucupi', meta: '2025 — vidéo' },
  { file: 'videos/06_bloom.mp4', vimeo: 'https://vimeo.com/1211353209', title: 'Bloom', meta: '2025 — vidéo' },
  { file: 'videos/07_typo_burn.mp4', vimeo: 'https://vimeo.com/1211401526', title: 'Typo burn', meta: '2025 — typographie animée' },
  { file: 'videos/08_allergie.mp4', vimeo: 'https://vimeo.com/1211397034', title: 'ALLERGIE', meta: '2025 — vidéo' },
]

// ---------------------------------------------------------------- scene

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf4f2ee)

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches

// Ouvert par double-clic (file://) : le navigateur interdit d'utiliser une vidéo
// locale comme texture WebGL. On passe par un sélecteur de fichiers et des URL
// blob: (même origine que la page => pas de blocage). En ligne (http/https),
// tout fonctionne directement depuis videos/, sans sélecteur.
const IS_LOCAL = location.protocol === 'file:'
const localURLs = {} // project.file -> blob: URL
let pickerOpen = IS_LOCAL

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, EYE_HEIGHT, 0)
camera.rotation.order = 'YXZ'

// portrait screens need a wider view to take the room in
function fitFov() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.fov = camera.aspect < 0.8 ? 80 : 58
  camera.updateProjectionMatrix()
}
fitFov()

// ---------------------------------------------------------------- room

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf6f4f0, roughness: 0.95, side: THREE.BackSide })
const wall = new THREE.Mesh(
  new THREE.CylinderGeometry(WALL_RADIUS, WALL_RADIUS, WALL_HEIGHT, 96, 1, true),
  wallMaterial,
)
wall.position.y = WALL_HEIGHT / 2
scene.add(wall)

// pearly white floor: a true mirror underneath, veiled by a milky
// translucent layer that softens the reflection like polished marble
const floorMirror = new THREE.Reflector(new THREE.CircleGeometry(WALL_RADIUS, 96), {
  textureWidth: Math.round(window.innerWidth * Math.min(window.devicePixelRatio, 1)),
  textureHeight: Math.round(window.innerHeight * Math.min(window.devicePixelRatio, 1)),
  color: 0xcfcdc8,
})
floorMirror.rotation.x = -Math.PI / 2
scene.add(floorMirror)

const floorVeil = new THREE.Mesh(
  new THREE.CircleGeometry(WALL_RADIUS, 96),
  new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.4, transparent: true, opacity: 0.75 }),
)
floorVeil.rotation.x = -Math.PI / 2
floorVeil.position.y = 0.002
scene.add(floorVeil)

const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.85, side: THREE.DoubleSide })

// curved cove between wall top and ceiling, quarter-ellipse profile
const covePoints = []
for (let i = 0; i <= 24; i++) {
  const t = (i / 24) * (Math.PI / 2)
  covePoints.push(new THREE.Vector2(
    COVE_INNER_RADIUS + (WALL_RADIUS - COVE_INNER_RADIUS) * Math.cos(t),
    WALL_HEIGHT + (COVE_TOP - WALL_HEIGHT) * Math.sin(t),
  ))
}
const cove = new THREE.Mesh(new THREE.LatheGeometry(covePoints, 96), trimMaterial)
scene.add(cove)

// wall moldings: baseboard + picture rail above the panels
function addMolding(profile) {
  const points = profile.map(([radius, y]) => new THREE.Vector2(radius, y))
  scene.add(new THREE.Mesh(new THREE.LatheGeometry(points, 96), trimMaterial))
}
// three concentric steps rising to the wall, mirroring the stepped cornice
// above — STEP_HEIGHT is the top tread, where baseboard and columns sit
const STEP_HEIGHT = 0.21
addMolding([
  [7.3, 0], [7.3, 0.07],
  [7.7, 0.07], [7.7, 0.14],
  [8.1, 0.14], [8.1, STEP_HEIGHT],
  [WALL_RADIUS, STEP_HEIGHT],
])

// baseboard on top of the step: stepped profile with a quarter-round cap
addMolding([
  [WALL_RADIUS, STEP_HEIGHT], [WALL_RADIUS - 0.1, STEP_HEIGHT],
  [WALL_RADIUS - 0.1, 0.3], [WALL_RADIUS - 0.07, 0.33],
  [WALL_RADIUS - 0.07, 0.36], [WALL_RADIUS - 0.03, 0.41], [WALL_RADIUS, 0.44],
])

// picture rail above the panels: thin bead under an ogee crown
addMolding([[WALL_RADIUS, 3.36], [WALL_RADIUS - 0.04, 3.39], [WALL_RADIUS - 0.04, 3.42], [WALL_RADIUS, 3.44]])
addMolding([
  [WALL_RADIUS, 3.48], [WALL_RADIUS - 0.09, 3.52],
  [WALL_RADIUS - 0.09, 3.58], [WALL_RADIUS - 0.05, 3.61], [WALL_RADIUS, 3.65],
])

// cornice where the wall meets the cove
addMolding([
  [WALL_RADIUS, 3.92], [WALL_RADIUS - 0.05, 3.95],
  [WALL_RADIUS - 0.05, 3.99], [WALL_RADIUS - 0.11, 4.04],
  [WALL_RADIUS - 0.11, 4.08], [WALL_RADIUS, WALL_HEIGHT],
])

// (columns between the panels removed 2026-06-12 to see the bare wall —
// restore from git: "feat: perimeter step under panels, columns between panels")

// light well spanning the whole ceiling: short recessed shaft above the cove
// rim, closed by a glowing veil — the room is lit from this giant skylight
const wellShaft = new THREE.Mesh(
  new THREE.CylinderGeometry(COVE_INNER_RADIUS, COVE_INNER_RADIUS, WELL_DEPTH, 96, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.BackSide }),
)
wellShaft.position.y = COVE_TOP + WELL_DEPTH / 2
scene.add(wellShaft)

const skylight = new THREE.Mesh(
  new THREE.CircleGeometry(COVE_INNER_RADIUS - 0.02, 96),
  new THREE.MeshBasicMaterial({ color: 0xfff7e2 }),
)
skylight.rotation.x = Math.PI / 2
skylight.position.y = COVE_TOP + WELL_DEPTH - 0.03
scene.add(skylight)

// molded ring around the skylight, where the cove ribs land
const wellRim = new THREE.Mesh(new THREE.TorusGeometry(COVE_INNER_RADIUS + 0.04, 0.09, 12, 96), trimMaterial)
wellRim.rotation.x = Math.PI / 2
wellRim.position.y = COVE_TOP
scene.add(wellRim)

scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c6, 1.1))
scene.add(new THREE.AmbientLight(0xffffff, 0.35))
const skyGlow = new THREE.PointLight(0xfff6e4, 130, 0, 1.8)
skyGlow.position.set(0, COVE_TOP + 0.2, 0)
scene.add(skyGlow)

// ---------------------------------------------------------------- panels

function makeVideoTexture(file) {
  const video = document.createElement('video')
  video.dataset.src = file // attached on demand by loadVideo
  video.muted = true
  video.loop = true
  video.playsInline = true
  // pas de bouton « télécharger », pas de PiP ni de diffusion vers un autre écran
  video.setAttribute('controlsList', 'nodownload noplaybackrate')
  video.disablePictureInPicture = true
  video.disableRemotePlayback = true
  video.draggable = false
  // pas de menu « Enregistrer la vidéo sous… » (clic droit / appui long)
  video.addEventListener('contextmenu', (e) => e.preventDefault())
  video.addEventListener('error', () => console.warn('Vidéo introuvable ou illisible :', video.dataset.src))
  const texture = new THREE.VideoTexture(video)
  texture.colorSpace = THREE.SRGBColorSpace
  // seen from inside the cylinder the U axis runs right-to-left: mirror it back
  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.x = -1
  texture.offset.x = 1
  return { video, texture }
}

// only the works near the view keep their video in memory (max 3 at a time)
function loadVideo(video) {
  if (video.dataset.loaded) return
  const src = IS_LOCAL ? localURLs[video.dataset.src] : video.dataset.src
  if (!src) return // fichier local pas encore choisi
  video.dataset.loaded = '1'
  video.preload = IS_TOUCH ? 'metadata' : 'auto'
  video.src = src
  // nudge the playhead so the first frame is decoded and paused panels are not black
  video.addEventListener('loadedmetadata', () => { video.currentTime = 0.01 }, { once: true })
  video.load()
}

function unloadVideo(video) {
  if (!video.dataset.loaded) return
  delete video.dataset.loaded
  video.pause()
  video.removeAttribute('src')
  video.load() // releases the buffer and the decoder
}

const panels = []
const panelArc = PANEL_WIDTH / PANEL_RADIUS
const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.BackSide })

for (let i = 0; i < PANEL_COUNT; i++) {
  const angle = (i / PANEL_COUNT) * Math.PI * 2
  const geometry = new THREE.CylinderGeometry(
    PANEL_RADIUS, PANEL_RADIUS, PANEL_HEIGHT,
    32, 1, true,
    angle - panelArc / 2, panelArc,
  )
  const { video, texture } = makeVideoTexture(PROJECTS[i].file)
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
  const panel = new THREE.Mesh(geometry, material)
  panel.position.y = PANEL_CENTER_Y
  panel.userData.angle = angle
  panel.userData.video = video
  scene.add(panel)
  panels.push(panel)

  // white frame in relief behind the screen, slightly larger all around
  const frameArc = panelArc + 0.12 / PANEL_RADIUS
  const frame = new THREE.Mesh(
    new THREE.CylinderGeometry(
      PANEL_RADIUS + 0.03, PANEL_RADIUS + 0.03, PANEL_HEIGHT + 0.12,
      32, 1, true,
      angle - frameArc / 2, frameArc,
    ),
    frameMaterial,
  )
  frame.position.y = PANEL_CENTER_Y
  scene.add(frame)

  // Anna's halo: enlarged blurred echo of the video, bleeding onto the wall
  // behind the frame — tiny canvas + blur filter, linear upscale does the rest
  const echoCanvas = document.createElement('canvas')
  echoCanvas.width = 96
  echoCanvas.height = 54
  const echoCtx = echoCanvas.getContext('2d')
  const echoTexture = new THREE.CanvasTexture(echoCanvas)
  echoTexture.colorSpace = THREE.SRGBColorSpace
  echoTexture.wrapS = THREE.RepeatWrapping
  echoTexture.repeat.x = -1
  echoTexture.offset.x = 1
  const echoArc = panelArc * 1.7
  const echo = new THREE.Mesh(
    new THREE.CylinderGeometry(
      8.985, 8.985, 3.9,
      32, 1, true,
      angle - echoArc / 2, echoArc,
    ),
    new THREE.MeshBasicMaterial({
      map: echoTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  )
  echo.position.y = PANEL_CENTER_Y
  scene.add(echo)
  panel.userData.echo = { mesh: echo, ctx: echoCtx, texture: echoTexture }

  // invisible uplight under each work, washing the wall around it
  const outward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle))
  const fixturePos = outward.clone().multiplyScalar(8.45).setY(STEP_HEIGHT)

  const spot = new THREE.SpotLight(0xfff2dc, 55, 8, 0.5, 0.55, 1.4)
  spot.position.copy(fixturePos).y += 0.2
  spot.target.position.copy(outward.clone().multiplyScalar(WALL_RADIUS).setY(PANEL_CENTER_Y + 0.3))
  scene.add(spot)
  scene.add(spot.target)
}

// ---------------------------------------------------------------- titles

// work title on the wall, top-right of each frame
for (let i = 0; i < PANEL_COUNT; i++) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 120
  const ctx = canvas.getContext('2d')
  ctx.font = '600 74px "Helvetica Neue", Helvetica, Arial, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#2b2b2b'
  ctx.fillText(PROJECTS[i].title.toUpperCase(), 8, 62)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const width = 1.1
  const TITLE_Y = 3.16
  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * 120 / 1024),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  )
  // hang it at the frame's top-right corner, clear of the column
  const angle = (i / PANEL_COUNT) * Math.PI * 2 - (panelArc / 2 + 0.015 + (width / 2) / 8.9)
  title.position.set(8.9 * Math.sin(angle), TITLE_Y, 8.9 * Math.cos(angle))
  title.lookAt(0, TITLE_Y, 0)
  scene.add(title)
}

// ---------------------------------------------------------------- lightbox

// fullscreen viewing: the panel's <video> element moves into the DOM overlay
// (it keeps feeding the 3D texture), native controls give play/seek/volume
const lightbox = document.getElementById('lightbox')
const closeBtn = document.getElementById('lightbox-close')
let lightboxVideo = null

function openLightbox(video) {
  lightboxVideo = video
  video.controls = true
  video.muted = false
  lightbox.insertBefore(video, closeBtn) // la croix reste au-dessus de la vidéo
  lightbox.classList.add('open')
  video.play().catch(() => {})
}

function closeLightbox() {
  if (!lightboxVideo) return
  lightboxVideo.controls = false
  lightboxVideo.muted = true
  lightbox.removeChild(lightboxVideo)
  lightboxVideo = null
  lightbox.classList.remove('open')
}

// click + pointerup : certains navigateurs mobiles ne déclenchent pas toujours « click »
closeBtn.addEventListener('click', closeLightbox)
closeBtn.addEventListener('pointerup', (e) => {
  e.stopPropagation()
  closeLightbox()
})
lightbox.addEventListener('contextmenu', (e) => e.preventDefault())
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox()
})
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox()
})

// ---------------------------------------------------------------- local file picker

const picker = document.getElementById('picker')
const pickerStatus = document.getElementById('picker-status')

function closePicker() {
  pickerOpen = false
  picker.classList.remove('open')
}

// associe les fichiers choisis aux 8 œuvres (nom exact, sinon numéro 01, 02...)
function attachLocalFiles(fileList) {
  const files = Array.from(fileList).filter((f) => /\.(mp4|m4v|mov|webm)$/i.test(f.name) || f.type.startsWith('video/'))
  let found = 0
  const missing = []
  for (const project of PROJECTS) {
    const name = project.file.split('/').pop().toLowerCase()
    const num = (name.match(/^\d+/) || [])[0]
    const match =
      files.find((f) => f.name.toLowerCase() === name) ||
      (num && files.find((f) => f.name.toLowerCase().startsWith(num + '_') || f.name.toLowerCase().startsWith(num + '.')))
    if (match) {
      if (localURLs[project.file]) URL.revokeObjectURL(localURLs[project.file])
      localURLs[project.file] = URL.createObjectURL(match)
      found++
    } else {
      missing.push(name)
    }
  }
  if (found === 0) {
    pickerStatus.textContent = 'Aucune vidéo reconnue. Noms attendus : ' + PROJECTS.map((p) => p.file.split('/').pop()).join(', ')
    return
  }
  if (missing.length) console.warn('Vidéos non trouvées :', missing.join(', '))
  closePicker()
}

if (IS_LOCAL) picker.classList.add('open')
document.getElementById('picker-folder').addEventListener('change', (e) => attachLocalFiles(e.target.files))
document.getElementById('picker-files').addEventListener('change', (e) => attachLocalFiles(e.target.files))
document.getElementById('picker-skip').addEventListener('click', closePicker)
window.addEventListener('dragover', (e) => e.preventDefault())
window.addEventListener('drop', (e) => {
  e.preventDefault()
  if (IS_LOCAL && e.dataTransfer.files.length) attachLocalFiles(e.dataTransfer.files)
})

// ---------------------------------------------------------------- controls

let targetTheta = 0
let currentTheta = 0

window.addEventListener('wheel', (e) => {
  if (lightboxVideo || pickerOpen) return
  targetTheta += e.deltaY * 0.0016
})

let dragging = false
let dragMoved = 0
let lastX = 0
let dragStartTheta = 0

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (lightboxVideo) return
  dragging = true
  dragMoved = 0
  lastX = e.clientX
  dragStartTheta = targetTheta
})

window.addEventListener('pointermove', (e) => {
  if (!dragging) return
  const dx = e.clientX - lastX
  lastX = e.clientX
  dragMoved += Math.abs(dx)
  // touch grabs the wall (drag right = wall follows), mouse keeps pan feel
  targetTheta += (e.pointerType === 'touch' ? 1 : -1) * dx * 0.0035
})

const raycaster = new THREE.Raycaster()

window.addEventListener('pointerup', (e) => {
  if (lightboxVideo) return
  dragging = false
  if (dragMoved > 5) {
    // touch swipe snaps to a work: a short flick advances to the neighbour,
    // a long drag settles on the nearest panel
    if (e.pointerType === 'touch') {
      const step = (Math.PI * 2) / PANEL_COUNT
      const travelled = targetTheta - dragStartTheta
      const snapped = Math.abs(travelled) < step / 2
        ? Math.round(dragStartTheta / step) + Math.sign(travelled || 1)
        : Math.round(targetTheta / step)
      targetTheta = snapped * step
    }
    return
  }
  // plain click on a work: open it fullscreen
  const pointer = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1,
  )
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster.intersectObjects(panels)[0]
  if (!hit) return
  openLightbox(hit.object.userData.video)
})

window.addEventListener('resize', () => {
  fitFov()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ---------------------------------------------------------------- loop

function animate() {
  requestAnimationFrame(animate)
  currentTheta += (targetTheta - currentTheta) * 0.06
  // rotation.y = theta + PI makes the camera face the wall point at `theta`
  camera.rotation.y = currentTheta + Math.PI

  // panel facing the camera at full brightness and playing, the others
  // slightly dimmed and paused (one video at a time)
  for (const panel of panels) {
    const offset = Math.abs(Math.atan2(
      Math.sin(panel.userData.angle - currentTheta),
      Math.cos(panel.userData.angle - currentTheta),
    ))
    const brightness = THREE.MathUtils.lerp(1, 0.62, Math.min(offset / (Math.PI / 2), 1))
    panel.material.color.setScalar(brightness)

    const video = panel.userData.video
    const facing = offset < 0.3

    // windowed loading: facing work + a neighbour on each side, with a margin
    // between the two thresholds so border panels don't load/unload in a loop
    const step = (Math.PI * 2) / PANEL_COUNT
    const loadAt = IS_LOCAL ? 0.55 : 1.15 // en local : seulement l'oeuvre regardée
    const unloadAt = IS_LOCAL ? 0.85 : 1.45
    if (offset < step * loadAt) loadVideo(video)
    else if (offset > step * unloadAt && video !== lightboxVideo) unloadVideo(video)

    // the lightbox owns its video's playback; catch: browsers refuse play()
    // while the tab is in the background
    if (video !== lightboxVideo) {
      if (facing && video.paused) video.play().catch(() => {})
      else if (!facing && !video.paused) video.pause()
    }

    // fade the blurred halo in behind the facing work, out elsewhere
    const echo = panel.userData.echo
    const material = echo.mesh.material
    material.opacity += ((facing ? 0.55 : 0) - material.opacity) * 0.06
    if (material.opacity > 0.01 && video.readyState >= 2) {
      echo.ctx.filter = 'blur(3px)'
      echo.ctx.drawImage(video, -8, -5, 112, 64) // overscan: no dark blur edges
      echo.ctx.filter = 'none'
      // feather the rectangle into the wall
      const mask = echo.ctx.createRadialGradient(48, 27, 12, 48, 27, 52)
      mask.addColorStop(0, 'rgba(0,0,0,1)')
      mask.addColorStop(0.75, 'rgba(0,0,0,0.85)')
      mask.addColorStop(1, 'rgba(0,0,0,0)')
      echo.ctx.globalCompositeOperation = 'destination-in'
      echo.ctx.fillStyle = mask
      echo.ctx.fillRect(0, 0, 96, 54)
      echo.ctx.globalCompositeOperation = 'source-over'
      echo.texture.needsUpdate = true
    }
  }

  renderer.render(scene, camera)
}

animate()
