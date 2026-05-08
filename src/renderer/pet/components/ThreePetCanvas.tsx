import React from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import robotModelUrl from "../assets3d/models/robot.glb"
import type { ExpressionPreset } from "../expressionManifest"
import type { SkinTheme } from "../skinManifest"
import type { MotionId } from "../../../shared/motionPresets"

interface ThreePetCanvasProps {
  animationName: string
  expression: ExpressionPreset
  motionId: MotionId
  onInitError: () => void
  skin: SkinTheme
}

function resolveClipByState(
  clips: THREE.AnimationClip[],
  animationName: string
): THREE.AnimationClip | null {
  if (clips.length === 0) {
    return null
  }

  const normalized = animationName.toLowerCase()
  const keywords =
    normalized === "sleep-powerdown"
      ? ["sleep", "idle"]
      : normalized === "working-tinker" || normalized === "thinking-tick"
        ? ["work", "run", "walk", "move", "idle"]
        : normalized.startsWith("success")
          ? ["jump", "wave", "cheer", "success", "idle"]
          : normalized === "fail-reboot"
            ? ["fail", "sad", "hit", "idle"]
            : ["idle", "stand"]

  for (const keyword of keywords) {
    const found = clips.find((clip) => clip.name.toLowerCase().includes(keyword))
    if (found) {
      return found
    }
  }

  return clips[0]
}

export function ThreePetCanvas({
  animationName,
  expression,
  motionId,
  onInitError,
  skin
}: ThreePetCanvasProps): React.ReactElement {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const animationRef = React.useRef(animationName)
  const expressionRef = React.useRef(expression)
  const motionRef = React.useRef(motionId)
  const skinRef = React.useRef(skin)

  animationRef.current = animationName
  expressionRef.current = expression
  motionRef.current = motionId
  skinRef.current = skin

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }
    const canvasEl = canvas

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas: canvasEl,
        powerPreference: "low-power"
      })
    } catch (error) {
      console.error("3D renderer initialization failed:", error)
      onInitError()
      return undefined
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(180, 180, false)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
    camera.position.set(0, 0.25, 5.2)

    scene.add(new THREE.HemisphereLight(0xeef8ff, 0x1d2935, 1.1))
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(2.8, 6.5, 5.4)
    scene.add(key)

    const fill = new THREE.DirectionalLight(0x9de6ff, 0.5)
    fill.position.set(-2.2, 1.9, 3)
    scene.add(fill)

    const root = new THREE.Group()
    scene.add(root)
    const timer = new THREE.Timer()
    timer.connect(document)
    timer.reset()
    const controls = new OrbitControls(camera, canvasEl)
    controls.enableRotate = true
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 4.8
    controls.maxDistance = 7.2
    controls.minPolarAngle = 1.36
    controls.maxPolarAngle = 1.72
    controls.minAzimuthAngle = -0.72
    controls.maxAzimuthAngle = 0.72
    controls.target.set(0, 0.25, 0)
    controls.update()

    let raf = 0
    let disposed = false
    let modelRoot: THREE.Object3D | null = null
    let mixer: THREE.AnimationMixer | null = null
    let activeAction: THREE.AnimationAction | null = null
    let animationClips: THREE.AnimationClip[] = []
    let activeClipName = ""
    let pendingClipName = ""
    let switchClipAt = 0
    const baseTransform = {
      x: 0,
      y: 0,
      z: 0,
      rotY: 0
    }
    let eyeMaterial: THREE.MeshStandardMaterial | null = null
    let faceMaterial: THREE.MeshStandardMaterial | null = null
    let tintTargets: THREE.MeshStandardMaterial[] = []

    const loader = new GLTFLoader()
    const viewport = {
      userYaw: 0
    }

    function fitModelToViewport(model: THREE.Object3D): void {
      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3()
      const center = new THREE.Vector3()
      box.getSize(size)
      box.getCenter(center)

      const maxAxis = Math.max(size.x, size.y, size.z) || 1
      const target = 2.15
      const scale = target / maxAxis
      model.scale.setScalar(scale)

      model.position.x = -center.x * scale
      model.position.y = -center.y * scale - 0.18
      model.position.z = -center.z * scale
      model.rotation.y = -0.1

      baseTransform.x = model.position.x
      baseTransform.y = model.position.y
      baseTransform.z = model.position.z
      baseTransform.rotY = model.rotation.y

      // Auto-fit with bottom safe area reserved for status bubble:
      // keep feet visible even when model rotates.
      const fittedBox = new THREE.Box3().setFromObject(model)
      const fittedSize = new THREE.Vector3()
      const fittedCenter = new THREE.Vector3()
      fittedBox.getSize(fittedSize)
      fittedBox.getCenter(fittedCenter)

      const canvasHeight = 180
      const topSafe = 10
      const bottomSafe = 56
      const usableRatio = (canvasHeight - topSafe - bottomSafe) / canvasHeight
      const fovRad = THREE.MathUtils.degToRad(camera.fov)
      const requiredFrustumHeight = fittedSize.y / Math.max(usableRatio, 0.35)
      const distance = (requiredFrustumHeight * 0.5) / Math.tan(fovRad * 0.5)
      const clampedDistance = THREE.MathUtils.clamp(distance * 1.08, 4.8, 7.2)
      camera.position.z = clampedDistance
      controls.minDistance = clampedDistance * 0.9
      controls.maxDistance = clampedDistance * 1.2

      controls.target.set(
        fittedCenter.x,
        fittedCenter.y + fittedSize.y * 0.12,
        fittedCenter.z
      )
      controls.update()
    }

    function collectMaterials(model: THREE.Object3D): void {
      const candidates: THREE.MeshStandardMaterial[] = []
      model.traverse((node: THREE.Object3D) => {
        if (!(node instanceof THREE.Mesh)) {
          return
        }
        const material = node.material
        if (!(material instanceof THREE.MeshStandardMaterial)) {
          return
        }

        const keyName = `${node.name} ${material.name}`.toLowerCase()
        if (!eyeMaterial && (keyName.includes("eye") || keyName.includes("screen"))) {
          eyeMaterial = material
        } else if (!faceMaterial && (keyName.includes("face") || keyName.includes("visor"))) {
          faceMaterial = material
        }

        candidates.push(material)
      })

      const unique = new Set(candidates)
      tintTargets = Array.from(unique)
    }

    function applySkinAndExpression(): void {
      const nextSkin = skinRef.current
      const nextExpression = expressionRef.current

      if (eyeMaterial) {
        const isWarn = nextExpression.eye === "warn"
        eyeMaterial.emissive.set(isWarn ? "#ff795e" : "#8bfff2")
        eyeMaterial.emissiveIntensity = isWarn ? 1.05 : 0.85
      }

      if (faceMaterial) {
        faceMaterial.emissive.set(nextExpression.eye === "warn" ? "#1d0f0e" : "#0c1d24")
        faceMaterial.emissiveIntensity = 0.35
      }

      const accent = new THREE.Color(nextSkin.headColor)
      for (const material of tintTargets) {
        if (material.metalness > 0.5 || material.roughness < 0.25) {
          continue
        }
        material.color.lerp(accent, 0.06)
      }
    }

    function playClip(clip: THREE.AnimationClip): void {
      if (!mixer) {
        return
      }

      const nextAction = mixer.clipAction(clip)
      nextAction.reset()
      nextAction.enabled = true
      nextAction.setEffectiveWeight(1)
      const speedScale =
        motionRef.current === "jog-burst"
          ? 0.8
          : motionRef.current === "walk-loop"
            ? 0.52
            : motionRef.current.startsWith("showcase")
              ? 0.68
              : motionRef.current === "finished-signal" ||
                  motionRef.current === "interaction-wave"
                ? 0.62
                : motionRef.current === "failed-reset"
                  ? 0.5
                  : motionRef.current === "sleep-slow"
                    ? 0.4
                    : 0.52
      nextAction.setEffectiveTimeScale(speedScale)
      nextAction.loop = !["walk-loop", "sleep-slow"].includes(motionRef.current)
        ? THREE.LoopOnce
        : THREE.LoopRepeat
      nextAction.clampWhenFinished = true

      if (activeAction) {
        activeAction.crossFadeTo(nextAction, 0.25, false)
      }
      nextAction.play()
      activeAction = nextAction
      activeClipName = clip.name
      pendingClipName = ""
    }

    function syncAnimationClip(now: number): void {
      if (!mixer || animationClips.length === 0) {
        return
      }
      const clip = resolveClipByState(animationClips, animationRef.current)
      if (!clip) {
        return
      }

      if (clip.name === activeClipName) {
        return
      }

      if (pendingClipName !== clip.name) {
        pendingClipName = clip.name
        switchClipAt = activeAction ? now + 0.55 : now
      }

      if (now < switchClipAt) {
        return
      }

      playClip(clip)
    }

    function animate(): void {
      if (disposed) {
        return
      }

      timer.update()
      const t = timer.getElapsed()
      const currentAnimation = animationRef.current
      const currentExpression = expressionRef.current
      const currentMotion = motionRef.current
      const delta = timer.getDelta()
      const motionDuty =
        currentMotion === "walk-loop"
          ? 0.5
          : currentMotion === "jog-burst"
            ? 0.72
            : currentMotion.startsWith("showcase")
              ? 0.64
              : currentAnimation === "working-tinker" || currentAnimation === "thinking-tick"
          ? 0.58
          : currentAnimation === "idle-breathe" || currentAnimation === "idle-scan"
            ? 0.5
            : 0.72
      const cycle = currentMotion === "sleep-slow" ? 5.4 : currentMotion === "jog-burst" ? 3.2 : 4.8
      const phase = (t % cycle) / cycle
      const envelope = phase <= motionDuty ? 1 : 0.06

      mixer?.update(delta * envelope)
      syncAnimationClip(t)

      if (modelRoot) {
        let y = Math.sin(t * 1.1) * 0.012
        let autoYaw = 0

        if (currentMotion === "jog-burst") {
          y = Math.sin(t * 3.1) * 0.028
          autoYaw = Math.sin(t * 2.6) * 0.012
        } else if (
          currentMotion === "showcase-a" ||
          currentMotion === "showcase-b" ||
          currentMotion === "showcase-c" ||
          currentMotion === "showcase-d"
        ) {
          y = Math.sin(t * 2.6) * 0.021
          autoYaw = Math.sin(t * 3.2) * 0.02
        } else if (currentAnimation === "working-tinker" || currentAnimation === "thinking-tick") {
          y = Math.sin(t * 2.3) * 0.02
          autoYaw = Math.sin(t * 2.1) * 0.008
        } else if (currentMotion === "finished-signal" || currentMotion === "interaction-wave") {
          y = Math.abs(Math.sin(t * 2.8)) * 0.05
          autoYaw = Math.sin(t * 1.9) * 0.007
        } else if (currentMotion === "failed-reset") {
          y = Math.sin(t * 4.5) * 0.009
          autoYaw = Math.sin(t * 4.9) * 0.016
        } else if (currentMotion === "sleep-slow") {
          y = Math.sin(t * 0.52) * 0.006 - 0.04
          autoYaw = 0
        }

        y *= envelope
        autoYaw *= envelope

        const hasNativeAnimation = animationClips.length > 0
        modelRoot.position.x = baseTransform.x
        modelRoot.position.y = hasNativeAnimation ? baseTransform.y : baseTransform.y + y
        modelRoot.position.z = baseTransform.z
        modelRoot.rotation.y = baseTransform.rotY + autoYaw + viewport.userYaw
        modelRoot.rotation.z =
          currentExpression.head === "tilt"
            ? -0.025
            : currentMotion === "interaction-nod"
              ? Math.sin(t * 7.2) * 0.03
              : 0
      }

      controls.update()
      viewport.userYaw = controls.getAzimuthalAngle() * 0.42
      applySkinAndExpression()
      renderer.render(scene, camera)
      raf = window.requestAnimationFrame(animate)
    }
    function stopCanvasEvent(event: Event): void {
      event.stopPropagation()
    }

    canvasEl.addEventListener("pointerdown", stopCanvasEvent)
    canvasEl.addEventListener("click", stopCanvasEvent)
    canvasEl.addEventListener("dblclick", stopCanvasEvent)
    canvasEl.addEventListener("wheel", stopCanvasEvent, { passive: true })

    loader.load(
      robotModelUrl,
      (gltf) => {
        if (disposed) {
          return
        }
        modelRoot = gltf.scene
        animationClips = gltf.animations ?? []
        if (animationClips.length > 0) {
          mixer = new THREE.AnimationMixer(modelRoot)
        }
        fitModelToViewport(modelRoot)
        collectMaterials(modelRoot)
        root.add(modelRoot)
        syncAnimationClip(timer.getElapsed())
        animate()
      },
      undefined,
      (error) => {
        console.error("Failed to load robot GLB:", error)
        onInitError()
      }
    )

    return () => {
      disposed = true
      window.cancelAnimationFrame(raf)
      canvasEl.removeEventListener("pointerdown", stopCanvasEvent)
      canvasEl.removeEventListener("click", stopCanvasEvent)
      canvasEl.removeEventListener("dblclick", stopCanvasEvent)
      canvasEl.removeEventListener("wheel", stopCanvasEvent)
      controls.dispose()
      mixer?.stopAllAction()
      mixer = null
      scene.traverse((node: THREE.Object3D) => {
        if (!(node instanceof THREE.Mesh)) {
          return
        }
        node.geometry.dispose()
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => mat.dispose())
        } else {
          node.material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [onInitError])

  return <canvas className="pet-three-canvas" ref={canvasRef} aria-hidden="true" />
}
