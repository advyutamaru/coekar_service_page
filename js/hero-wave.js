// ミニマリスト音声結晶化ビジュアライザー
let scene, camera, renderer;
let waterFlow, crystalFormation, textCanvas;
let animationFrame;
let time = 0;
let mouseX = 0, mouseY = 0;

// 状態管理（シンプル化）
const state = {
    phase: 'idle', // idle, flowing, crystallizing, complete
    flowIntensity: 0,
    crystallization: 0,
    completion: 0
};

// ミニマルカラーパレット（2色のみ）
const palette = {
    primary: 0x0ea5e9,   // 水色（流体）
    secondary: 0xffffff,  // 白（結晶）
    background: 0x000510  // 深い藍色
};

function initWaveAnimation() {
    // シーン設定（シンプル）
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(palette.background, 200, 800);

    // カメラ設定（固定視点）
    camera = new THREE.PerspectiveCamera(
        50, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    // レンダラー設定（最小限）
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(palette.background, 0.05);
    
    const container = document.getElementById('hero-canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // 最小限のライティング
    setupMinimalLighting();
    
    // コア要素（水のメタファー）
    createWaterFlow();
    createCrystallization();
    createTextFormation();
    
    // シンプルなインタラクション
    setupMinimalInteractions();
    
    // リサイズ対応
    window.addEventListener('resize', onWindowResize);
}

function setupMinimalLighting() {
    // 単一の環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    // 単一のポイントライト
    const pointLight = new THREE.PointLight(palette.primary, 0.5, 200);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);
}

function createWaterFlow() {
    // 水の流れ（音声メタファー）
    const flowGroup = new THREE.Group();
    
    // シンプルな流体シェーダー
    const flowGeometry = new THREE.PlaneGeometry(120, 60, 64, 32);
    const flowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            flowIntensity: { value: 0 },
            mousePosition: { value: new THREE.Vector2(0, 0) },
            primaryColor: { value: new THREE.Color(palette.primary) },
            opacity: { value: 0.6 }
        },
        vertexShader: `
            uniform float time;
            uniform float flowIntensity;
            uniform vec2 mousePosition;
            varying vec2 vUv;
            varying float vElevation;
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // 水の波紋効果
                float wave = sin(position.x * 0.1 + time) * cos(position.y * 0.1 + time * 0.5);
                wave *= flowIntensity;
                
                // マウス影響（控えめ）
                float mouseDistance = distance(position.xy, mousePosition * 50.0);
                float mouseInfluence = smoothstep(30.0, 0.0, mouseDistance) * 0.3;
                
                pos.z = wave * 10.0 + mouseInfluence * 5.0;
                vElevation = pos.z;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 primaryColor;
            uniform float opacity;
            uniform float time;
            varying vec2 vUv;
            varying float vElevation;
            
            void main() {
                // グラデーション効果
                float gradient = smoothstep(0.0, 1.0, vUv.x);
                
                // 深度による透明度
                float alpha = opacity * (1.0 - abs(vElevation) * 0.02);
                
                // 流れる効果
                vec3 color = primaryColor;
                color *= 1.0 + sin(vUv.x * 10.0 + time) * 0.1;
                
                gl_FragColor = vec4(color, alpha * gradient);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    
    const flowMesh = new THREE.Mesh(flowGeometry, flowMaterial);
    flowMesh.position.x = -30;
    flowGroup.add(flowMesh);
    
    waterFlow = flowGroup;
    scene.add(flowGroup);
}

function createCrystallization() {
    // 結晶化プロセス（変換メタファー）
    const crystalGroup = new THREE.Group();
    
    // 結晶パーティクル（最小限）
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        // 中央付近に配置
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        
        scales[i] = Math.random() * 3 + 1;
        opacities[i] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    // カスタムシェーダーで結晶表現
    const crystalMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            crystallization: { value: 0 },
            color: { value: new THREE.Color(palette.secondary) }
        },
        vertexShader: `
            attribute float scale;
            attribute float opacity;
            uniform float crystallization;
            varying float vOpacity;
            
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = scale * crystallization * 10.0 * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
                vOpacity = opacity * crystallization;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vOpacity;
            
            void main() {
                // 六角形の結晶形状
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                
                // シャープなエッジ
                float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
                alpha *= vOpacity;
                
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    const crystals = new THREE.Points(geometry, crystalMaterial);
    crystalGroup.add(crystals);
    
    crystalFormation = crystalGroup;
    scene.add(crystalGroup);
}

function createTextFormation() {
    // テキスト形成（最終形態）
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 初期状態（透明）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const textGeometry = new THREE.PlaneGeometry(60, 30);
    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0
    });
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.x = 30;
    scene.add(textMesh);
    
    textCanvas = {
        mesh: textMesh,
        canvas: canvas,
        ctx: ctx,
        texture: texture
    };
}

function setupMinimalInteractions() {
    // マウス移動（最小限の反応）
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    
    // CTAボタン連携
    const ctaButton = document.querySelector('.hero-cta');
    if (ctaButton) {
        ctaButton.addEventListener('mouseenter', () => {
            startTransformation();
        });
        
        ctaButton.addEventListener('mouseleave', () => {
            if (state.phase !== 'complete') {
                resetTransformation();
            }
        });
        
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            completeTransformation();
        });
    }
}

function startTransformation() {
    state.phase = 'flowing';
    state.flowIntensity = 0;
    
    // 流れ開始
    const flowInterval = setInterval(() => {
        state.flowIntensity += 0.02;
        if (state.flowIntensity >= 1) {
            state.flowIntensity = 1;
            clearInterval(flowInterval);
            startCrystallization();
        }
    }, 20);
}

function startCrystallization() {
    state.phase = 'crystallizing';
    state.crystallization = 0;
    
    // 結晶化プロセス
    const crystalInterval = setInterval(() => {
        state.crystallization += 0.02;
        if (state.crystallization >= 1) {
            state.crystallization = 1;
            clearInterval(crystalInterval);
            formText();
        }
    }, 20);
}

function formText() {
    state.phase = 'complete';
    state.completion = 0;
    
    // テキスト形成
    const ctx = textCanvas.ctx;
    const canvas = textCanvas.canvas;
    
    const completeInterval = setInterval(() => {
        state.completion += 0.05;
        
        // テキストを徐々に描画
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgba(255, 255, 255, ${state.completion})`;
        ctx.font = '32px "Noto Sans JP", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 医療記録のサンプルテキスト
        ctx.fillText('診察記録', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '20px "Noto Sans JP", sans-serif';
        ctx.fillText('音声から自動生成', canvas.width / 2, canvas.height / 2);
        ctx.fillText('2024.01.20 10:30', canvas.width / 2, canvas.height / 2 + 40);
        
        textCanvas.texture.needsUpdate = true;
        textCanvas.mesh.material.opacity = state.completion;
        
        if (state.completion >= 1) {
            state.completion = 1;
            clearInterval(completeInterval);
        }
    }, 50);
}

function resetTransformation() {
    state.phase = 'idle';
    state.flowIntensity = 0;
    state.crystallization = 0;
    state.completion = 0;
    
    // テキストをクリア
    const ctx = textCanvas.ctx;
    ctx.clearRect(0, 0, textCanvas.canvas.width, textCanvas.canvas.height);
    textCanvas.texture.needsUpdate = true;
    textCanvas.mesh.material.opacity = 0;
}

function completeTransformation() {
    // 即座に完了状態へ
    state.phase = 'complete';
    state.flowIntensity = 1;
    state.crystallization = 1;
    formText();
}

function updateAnimation() {
    time += 0.01;
    
    // 水の流れ更新
    if (waterFlow) {
        const flowMesh = waterFlow.children[0];
        if (flowMesh && flowMesh.material.uniforms) {
            flowMesh.material.uniforms.time.value = time;
            flowMesh.material.uniforms.flowIntensity.value = state.flowIntensity;
            flowMesh.material.uniforms.mousePosition.value.set(mouseX, mouseY);
            
            // 流れている時は右へ移動
            if (state.phase === 'flowing') {
                flowMesh.position.x = -30 + state.flowIntensity * 30;
            }
        }
    }
    
    // 結晶化更新
    if (crystalFormation) {
        const crystals = crystalFormation.children[0];
        if (crystals && crystals.material.uniforms) {
            crystals.material.uniforms.time.value = time;
            crystals.material.uniforms.crystallization.value = state.crystallization;
            
            // 結晶の成長
            if (state.phase === 'crystallizing') {
                const opacities = crystals.geometry.attributes.opacity.array;
                for (let i = 0; i < opacities.length; i++) {
                    opacities[i] = Math.min(1, opacities[i] + Math.random() * 0.02);
                }
                crystals.geometry.attributes.opacity.needsUpdate = true;
            }
        }
    }
    
    // カメラの微細な呼吸
    camera.position.z = 100 + Math.sin(time * 0.5) * 2;
}

function animate() {
    animationFrame = requestAnimationFrame(animate);
    
    updateAnimation();
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initWaveAnimation();
    animate();
});