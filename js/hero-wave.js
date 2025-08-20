// 3D音声波形ビジュアライザー
let scene, camera, renderer;
let waveformParticles = [];
let audioVisualizerBars = [];
let animationId;
let time = 0;
let isPlaying = true;
let audioIntensity = 0;
let targetIntensity = 0.5;

// コエカルブランドカラー（医療系の信頼感）
const brandColors = {
    primary: 0x1e3a8a,     // ディープブルー
    secondary: 0x3b82f6,   // ブライトブルー
    accent: 0x60a5fa,      // ライトブルー
    pulse: 0x93c5fd,       // パルスブルー
    white: 0xf0f9ff,       // ソフトホワイト
    glow: 0xdbeafe         // グロー
};

function initWaveAnimation() {
    // シーン設定
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000820, 100, 500);

    // カメラ設定（視線を水平に）
    camera = new THREE.PerspectiveCamera(
        70, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 15, 80);
    camera.lookAt(0, -5, 0);

    // レンダラー設定
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    const container = document.getElementById('hero-canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // ライティング（医療的なクリーンな印象）
    const ambientLight = new THREE.AmbientLight(0x404060, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(0, 30, 30);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(brandColors.accent, 0.3);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // 音声波形ビジュアライザー作成
    createAudioVisualizer();
    
    // 中央のパルスリング作成
    createCentralPulse();
    
    // 背景のパーティクルフィールド
    createBackgroundField();

    // リサイズハンドラー
    window.addEventListener('resize', onWindowResize);
}

function createAudioVisualizer() {
    // 音声波形バーの作成（円形配置）
    const barCount = 128;
    const radius = 100;
    
    for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;
        
        // 各バーのジオメトリ
        const geometry = new THREE.BoxGeometry(2, 1, 2);
        const material = new THREE.MeshPhongMaterial({
            color: brandColors.secondary,
            emissive: brandColors.primary,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        const bar = new THREE.Mesh(geometry, material);
        
        // 円形に配置
        bar.position.x = Math.cos(angle) * radius;
        bar.position.z = Math.sin(angle) * radius;
        bar.position.y = -20;
        
        // バーの向きを中心に向ける
        bar.lookAt(0, bar.position.y, 0);
        
        bar.userData = {
            angle: angle,
            baseY: -20,
            index: i,
            frequency: Math.random() * 0.05 + 0.01
        };
        
        audioVisualizerBars.push(bar);
        scene.add(bar);
    }
    
    // 内側の波形リング
    createWaveformRings();
}

function createWaveformRings() {
    // 複数の波形リングを作成
    const ringCount = 5;
    
    for (let r = 0; r < ringCount; r++) {
        const radius = 60 + r * 20;
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = -20;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // グラデーションカラー
            const intensity = 1 - r * 0.15;
            colors[i * 3] = 0.12 * intensity;
            colors[i * 3 + 1] = 0.32 * intensity;
            colors[i * 3 + 2] = 0.56 * intensity;
            
            sizes[i] = (3 - r * 0.4) * (0.8 + Math.random() * 0.4);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // パーティクルテクスチャ
        const canvas = createGlowTexture();
        const texture = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.PointsMaterial({
            size: 4,
            map: texture,
            transparent: true,
            opacity: 0.6 - r * 0.1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const ring = new THREE.Points(geometry, material);
        ring.userData = {
            radius: radius,
            ringIndex: r,
            particleCount: particleCount
        };
        
        waveformParticles.push(ring);
        scene.add(ring);
    }
}

function createCentralPulse() {
    // 中央のパルスエフェクト（声の発信源）
    const geometry = new THREE.RingGeometry(5, 8, 32);
    const material = new THREE.MeshBasicMaterial({
        color: brandColors.accent,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    const pulseRing = new THREE.Mesh(geometry, material);
    pulseRing.position.y = -19;
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.userData.isPulse = true;
    
    scene.add(pulseRing);
    
    // 複数のパルスリング
    for (let i = 1; i < 4; i++) {
        const ring = pulseRing.clone();
        ring.scale.set(1 + i * 0.5, 1 + i * 0.5, 1);
        ring.material = material.clone();
        ring.material.opacity = 0.3 / i;
        ring.userData.pulseDelay = i * 500;
        scene.add(ring);
    }
}

function createBackgroundField() {
    // 背景の浮遊パーティクル（データの流れを表現）
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        // ランダムな位置（中央は避ける）
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 200;
        const height = (Math.random() - 0.5) * 100;
        
        positions[i * 3] = Math.cos(angle) * distance;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * distance;
        
        // 青系のグラデーション
        colors[i * 3] = 0.2 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
        
        sizes[i] = Math.random() * 2 + 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 2,
        transparent: true,
        opacity: 0.3,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const backgroundField = new THREE.Points(geometry, material);
    backgroundField.userData.isBackground = true;
    scene.add(backgroundField);
}

function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(147, 197, 253, 1)');
    gradient.addColorStop(0.2, 'rgba(96, 165, 250, 0.8)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(30, 58, 138, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return canvas;
}

function updateAudioVisualizer() {
    // 音声強度のシミュレーション
    targetIntensity = 0.3 + Math.sin(time * 0.002) * 0.2 + 
                      Math.sin(time * 0.005) * 0.1 + 
                      Math.random() * 0.1;
    
    audioIntensity += (targetIntensity - audioIntensity) * 0.1;
    
    // 音声バーのアニメーション
    audioVisualizerBars.forEach((bar, index) => {
        const frequency = bar.userData.frequency;
        const angle = bar.userData.angle;
        
        // 周波数に基づく高さ
        const waveHeight = Math.sin(time * frequency + index * 0.1) * 20 * audioIntensity +
                          Math.sin(time * frequency * 2 + index * 0.05) * 10 * audioIntensity +
                          Math.random() * 2;
        
        // スケールアニメーション
        bar.scale.y = Math.max(0.5, Math.abs(waveHeight));
        bar.position.y = bar.userData.baseY + waveHeight / 2;
        
        // 色の変化（音量に応じて）
        const intensity = Math.abs(waveHeight) / 20;
        bar.material.emissiveIntensity = 0.2 + intensity * 0.3;
        
        // 中央に近いバーを強調（テキストエリアを考慮）
        const distanceFromCenter = Math.abs(angle - Math.PI);
        if (distanceFromCenter < Math.PI / 4) {
            bar.scale.y *= 0.3; // 中央エリアのバーを低く
            bar.material.opacity = 0.4;
        } else {
            bar.material.opacity = 0.8;
        }
    });
    
    // 波形リングの更新
    updateWaveformRings();
    
    // パルスエフェクトの更新
    updatePulseEffect();
}

function updateWaveformRings() {
    waveformParticles.forEach(ring => {
        const positions = ring.geometry.attributes.position.array;
        const radius = ring.userData.radius;
        const particleCount = ring.userData.particleCount;
        const ringIndex = ring.userData.ringIndex;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            
            // 波形に基づく変位
            const waveOffset = Math.sin(time * 0.002 + angle * 4 + ringIndex) * 5 * audioIntensity;
            const radiusOffset = Math.sin(time * 0.001 + i * 0.1) * 3;
            
            const currentRadius = radius + waveOffset + radiusOffset;
            
            positions[i * 3] = Math.cos(angle) * currentRadius;
            positions[i * 3 + 1] = -20 + Math.sin(time * 0.003 + i * 0.05) * 2 * audioIntensity;
            positions[i * 3 + 2] = Math.sin(angle) * currentRadius;
        }
        
        ring.geometry.attributes.position.needsUpdate = true;
        
        // リング全体の回転
        ring.rotation.y = time * 0.0002 * (1 + ringIndex * 0.1);
    });
}

function updatePulseEffect() {
    // パルスリングのアニメーション
    scene.traverse(object => {
        if (object.userData.isPulse) {
            const scale = 1 + Math.sin(time * 0.003) * 0.2 * audioIntensity;
            object.scale.set(scale, scale, 1);
            object.material.opacity = 0.6 - Math.sin(time * 0.003) * 0.3;
        }
    });
}

function updateBackgroundField() {
    // 背景パーティクルの動き
    scene.traverse(object => {
        if (object.userData.isBackground) {
            object.rotation.y = time * 0.00005;
            
            const positions = object.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(time * 0.001 + i) * 0.1;
            }
            object.geometry.attributes.position.needsUpdate = true;
        }
    });
}

function animate() {
    if (!isPlaying) return;
    
    animationId = requestAnimationFrame(animate);
    time++;

    updateAudioVisualizer();
    updateBackgroundField();

    // カメラの微妙な動き
    camera.position.x = Math.sin(time * 0.0002) * 10;
    camera.position.y = 15 + Math.sin(time * 0.0003) * 5;
    camera.position.z = 80 + Math.cos(time * 0.0002) * 10;
    camera.lookAt(0, -5, 0);

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ヒーローセクションのインタラクション
function initHeroInteractions() {
    const ctaButton = document.querySelector('.hero-cta');
    if (ctaButton) {
        ctaButton.addEventListener('mouseenter', function() {
            // ホバー時に音声強度を上げる
            targetIntensity = 0.8;
            
            // バーを活性化
            audioVisualizerBars.forEach(bar => {
                bar.material.emissiveIntensity = 0.5;
            });
        });
        
        ctaButton.addEventListener('mouseleave', function() {
            targetIntensity = 0.5;
            
            audioVisualizerBars.forEach(bar => {
                bar.material.emissiveIntensity = 0.2;
            });
        });
        
        ctaButton.addEventListener('click', function() {
            // クリック時にパルス波を発生
            createClickPulse();
        });
    }
    
    // 資料ダウンロードボタン
    const secondaryButton = document.querySelector('.btn-secondary');
    if (secondaryButton) {
        secondaryButton.addEventListener('mouseenter', function() {
            // 波形の色を変化
            audioVisualizerBars.forEach(bar => {
                bar.material.color.set(brandColors.accent);
            });
        });
        
        secondaryButton.addEventListener('mouseleave', function() {
            audioVisualizerBars.forEach(bar => {
                bar.material.color.set(brandColors.secondary);
            });
        });
    }
}

// クリック時のパルス波
function createClickPulse() {
    const geometry = new THREE.RingGeometry(10, 15, 32);
    const material = new THREE.MeshBasicMaterial({
        color: brandColors.pulse,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const pulse = new THREE.Mesh(geometry, material);
    pulse.position.y = -19;
    pulse.rotation.x = -Math.PI / 2;
    scene.add(pulse);
    
    // アニメーション
    let scale = 1;
    const expandPulse = setInterval(() => {
        scale += 0.5;
        pulse.scale.set(scale, scale, 1);
        pulse.material.opacity -= 0.02;
        
        if (pulse.material.opacity <= 0) {
            scene.remove(pulse);
            clearInterval(expandPulse);
        }
    }, 16);
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initWaveAnimation();
    initHeroInteractions();
    animate();
});