import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import windowVertexShader from './shaders/window/vertex.glsl'
import windowFragmentShader from './shaders/window/fragment.glsl'

// console.log(waterFragmentShader)
// console.log(waterVertexShader)
// console.log(windowFragmentShader)
// console.log(windowVertexShader)

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 300
})
gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding


/**
 * Model Materials
 */
// Baked Material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

// Pole light Material
debugObject.poleLightColor = 0xABDAFF
const poleLightMaterial = new THREE.MeshBasicMaterial({color: debugObject.poleLightColor})

// Portal light Material
const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(0x000000)},
        uColorEnd: { value: new THREE.Color(0xffffff)}
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
})

// Water Material
const waterMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uWaterSpeedMultiplier: { value: 0.2 },
        uWaterPattern: { value: 5.0},
        uWaterColorStart: {value : new THREE.Color(0x004875)},
        uWaterColorEnd: {value : new THREE.Color(0x141414)}
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,

})

// Window Material
const windowMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uColor: { value : new THREE.Color(0xffffff)}
    },
    vertexShader: windowVertexShader,
    fragmentShader: windowFragmentShader
})

/**
 * Model
 */
gltfLoader.load(
    'scene.glb',
    (gltf) =>
    {       
        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')

        const portalLightMesh = gltf.scene.children.find(child => child.name === 'portalLight')
        const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
        const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')
        const water = gltf.scene.children.find(child => child.name === 'water')
        const windowLight = gltf.scene.children.find(child => child.name === 'windowLight')

        // console.log(portalLightMesh)
        // console.log(poleLightAMesh)
        // console.log(poleLightBMesh)
        // console.log(bakedMesh)
        // console.log(windowLight)
        // console.log(water)

        bakedMesh.material = bakedMaterial
        
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        portalLightMesh.material = portalLightMaterial
        water.material = waterMaterial
        windowLight.material = windowMaterial

        scene.add(gltf.scene)
    }
)

/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 40
const firefliesPosition = new Float32Array(firefliesCount * 3)
const firefliesScale = new Float32Array(firefliesCount)



for(let i = 0; i < firefliesCount; i++)
{
    firefliesPosition[i * 3 + 0] = (Math.random() - 0.5) * 10
    firefliesPosition[i * 3 + 1] = Math.random() * 1.5
    firefliesPosition[i * 3 + 2] = (Math.random() - 0.5) * 10

    firefliesScale[i] = Math.random()
}

firefliesGeometry.setAttribute( 'position', new THREE.BufferAttribute(firefliesPosition, 3))
firefliesGeometry.setAttribute( 'aScale', new THREE.BufferAttribute(firefliesScale, 1))

// console.log(firefliesGeometry)

// Material
const firefliesMaterial = new THREE.ShaderMaterial(
    {
        uniforms:
        {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            uSize: { value: 200 }
        },
        vertexShader: firefliesVertexShader,
        fragmentShader: firefliesFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    }
)

// Tweaks
gui.add(firefliesMaterial.uniforms.uSize, 'value' ).min(20).max(500).step(1).name('Firefly size')
gui.addColor(portalLightMaterial.uniforms.uColorStart, 'value').name('Portal start')
gui.addColor(portalLightMaterial.uniforms.uColorEnd, 'value').name('Portal end')
gui.add(waterMaterial.uniforms.uWaterSpeedMultiplier, 'value' ).min(0.1).max(20).step(0.1).name('Water speed')
gui.add(waterMaterial.uniforms.uWaterPattern, 'value' ).min(0.0).max(20).step(1).name('Water pattern')
gui.addColor(waterMaterial.uniforms.uWaterColorStart, 'value').name('Water start')
gui.addColor(waterMaterial.uniforms.uWaterColorEnd, 'value').name('Water end')
gui.addColor(windowMaterial.uniforms.uColor, 'value').name('Window color')
gui
    .addColor(debugObject, 'poleLightColor')
    .onChange(() =>
    {
        poleLightMaterial.color = new THREE.Color(debugObject.poleLightColor)
    })



// Mesh
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)

})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.maxDistance = 10
controls.maxPolarAngle = Math.PI * 0.4


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

debugObject.clearColor = '#292929'
debugObject.fogColor = '#292929'
debugObject.fogMinDistance = 0
debugObject.fogMaxDistance = 20
const sceneFog = new THREE.Fog(debugObject.fogColor, debugObject.fogMinDistance, debugObject.fogMaxDistance)
scene.fog = sceneFog

renderer.setClearColor(debugObject.clearColor)
gui
    .addColor(debugObject, 'clearColor')
    .onChange(() =>
    {
        renderer.setClearColor(debugObject.clearColor)
    })
gui
    .addColor(debugObject, 'fogColor').name('fogColor')
    .onChange(() =>
    {
        sceneFog.color = new THREE.Color(debugObject.fogColor)
    })
gui.add(sceneFog, 'near').min(-15).max(25).step(1).name('Fog near')
gui.add(sceneFog, 'far').min(-15).max(100).step(1).name('Fog far')

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update material
    fireflies.material.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()