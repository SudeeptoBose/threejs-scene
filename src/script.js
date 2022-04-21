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
const poleLightMaterial = new THREE.MeshBasicMaterial({color: 0xABDAFF})

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

        console.log(portalLightMesh)
        console.log(poleLightAMesh)
        console.log(poleLightBMesh)
        console.log(bakedMesh)
        console.log(windowLight)
        console.log(water)

        bakedMesh.material = bakedMaterial
        
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        portalLightMesh.material = portalLightMaterial
        water.material = portalLightMaterial
        windowLight.material = portalLightMaterial

        scene.add(gltf.scene)
    }
)

/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 20
const firefliesPosition = new Float32Array(firefliesCount * 3)
const firefliesScale = new Float32Array(firefliesCount)



for(let i = 0; i < firefliesCount; i++)
{
    firefliesPosition[i * 3 + 0] = (Math.random() - 0.5) * 4
    firefliesPosition[i * 3 + 1] = Math.random() * 1.5
    firefliesPosition[i * 3 + 2] = (Math.random() - 0.5) * 4

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
gui.add(firefliesMaterial.uniforms.uSize, 'value' ).min(20).max(500).step(1).name('Firefly Size')
gui.addColor(portalLightMaterial.uniforms.uColorStart, 'value').name('Portal start')
gui.addColor(portalLightMaterial.uniforms.uColorEnd, 'value').name('Portal end')

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

debugObject.clearColor = '#012c46'
renderer.setClearColor(debugObject.clearColor)
gui
    .addColor(debugObject, 'clearColor')
    .onChange(() =>
    {
        renderer.setClearColor(debugObject.clearColor)
    })

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

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()