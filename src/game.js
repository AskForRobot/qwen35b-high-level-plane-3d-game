// Game variables
let scene, camera, renderer;
let player;
let bullets = [];
let enemies = [];
let particles = [];
let score = 0;
let health = 100;
let gameRunning = true;
let keys = {};
let lastShotTime = 0;
let lastEnemySpawnTime = 0;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create player airplane
    createPlayer();

    // Create ground
    createGround();

    // Event listeners
    document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    window.addEventListener('resize', onWindowResize);

    // Start game loop
    animate();
}

function createPlayer() {
    player = new THREE.Group();

    // Fuselage
    const fuselageGeometry = new THREE.BoxGeometry(2, 2, 8);
    const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x3366cc });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.castShadow = true;
    player.add(fuselage);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(12, 0.5, 4);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x6699ff });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, 0, 0);
    wings.castShadow = true;
    player.add(wings);

    // Tail
    const tailGeometry = new THREE.BoxGeometry(4, 0.5, 2);
    const tailMaterial = new THREE.MeshLambertMaterial({ color: 0x6699ff });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, 3);
    tail.castShadow = true;
    player.add(tail);

    // Vertical stabilizer
    const verticalStabilizerGeometry = new THREE.BoxGeometry(0.5, 3, 2);
    const verticalStabilizerMaterial = new THREE.MeshLambertMaterial({ color: 0x3366cc });
    const verticalStabilizer = new THREE.Mesh(verticalStabilizerGeometry, verticalStabilizerMaterial);
    verticalStabilizer.position.set(0, 1.5, 3);
    verticalStabilizer.castShadow = true;
    player.add(verticalStabilizer);

    // Propeller
    const propellerGeometry = new THREE.BoxGeometry(4, 0.3, 0.5);
    const propellerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
    propeller.position.set(0, 0, -4.2);
    player.add(propeller);

    player.position.set(0, 15, 0);
    scene.add(player);
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add some trees
    for (let i = 0; i < 50; i++) {
        const treeX = (Math.random() - 0.5) * 400;
        const treeZ = (Math.random() - 0.5) * 400;
        const tree = new THREE.Group();

        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -7.5;
        tree.add(trunk);

        const leavesGeometry = new THREE.ConeGeometry(3, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = -4;
        tree.add(leaves);

        tree.position.set(treeX, 0, treeZ);
        scene.add(tree);
    }
}

function createBullet() {
    const bulletGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bullet.position.copy(player.position);
    bullet.position.z -= 4;
    bullet.rotation.x = Math.PI / 2;

    scene.add(bullet);
    bullets.push({
        mesh: bullet,
        velocity: new THREE.Vector3(0, 0, -2),
        life: 200
    });
}

function createEnemy() {
    const enemy = new THREE.Group();

    // Enemy fuselage
    const enemyFuselageGeometry = new THREE.BoxGeometry(1.5, 1.5, 6);
    const enemyFuselageMaterial = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
    const enemyFuselage = new THREE.Mesh(enemyFuselageGeometry, enemyFuselageMaterial);
    enemyFuselage.castShadow = true;
    enemy.add(enemyFuselage);

    // Enemy wings
    const enemyWingGeometry = new THREE.BoxGeometry(10, 0.4, 3);
    const enemyWingMaterial = new THREE.MeshLambertMaterial({ color: 0xff6666 });
    const enemyWings = new THREE.Mesh(enemyWingGeometry, enemyWingMaterial);
    enemyWings.position.set(0, 0, 0);
    enemyWings.castShadow = true;
    enemy.add(enemyWings);

    // Enemy tail
    const enemyTailGeometry = new THREE.BoxGeometry(3, 0.4, 1.5);
    const enemyTailMaterial = new THREE.MeshLambertMaterial({ color: 0xff6666 });
    const enemyTail = new THREE.Mesh(enemyTailGeometry, enemyTailMaterial);
    enemyTail.position.set(0, 0, 2.5);
    enemyTail.castShadow = true;
    enemy.add(enemyTail);

    // Random spawn position
    const spawnX = (Math.random() - 0.5) * 80;
    const spawnY = 10 + Math.random() * 15;
    const spawnZ = 80 + Math.random() * 50;

    enemy.position.set(spawnX, spawnY, spawnZ);
    scene.add(enemy);

    enemies.push({
        mesh: enemy,
        velocity: new THREE.Vector3(0, 0, -0.3),
        health: 1
    });
}

function createExplosion(position) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 1, 0.5)
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 2;
        particle.position.y += (Math.random() - 0.5) * 2;
        particle.position.z += (Math.random() - 0.5) * 2;

        scene.add(particle);

        particles.push({
            mesh: particle,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1
            ),
            life: 60
        });
    }
}

function updatePlayer() {
    const speed = 0.5;
    if (keys['w'] || keys['arrowup']) {
        player.position.z -= speed;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.position.z += speed;
    }
    if (keys['a'] || keys['arrowleft']) {
        player.position.x -= speed;
    }
    if (keys['d'] || keys['arrowright']) {
        player.position.x += speed;
    }

    // Clamp player position
    player.position.x = Math.max(-40, Math.min(40, player.position.x));
    player.position.z = Math.max(-30, Math.min(30, player.position.z));
    player.position.y = 15;

    // Rotate plane based on movement
    if (keys['a'] || keys['arrowleft']) {
        player.rotation.z = 0.3;
    } else if (keys['d'] || keys['arrowright']) {
        player.rotation.z = -0.3;
    } else {
        player.rotation.z = 0;
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.mesh.position.add(bullet.velocity);
        bullet.life--;

        if (bullet.life <= 0) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.mesh.position.add(enemy.velocity);

        // Check if enemy passed the player
        if (enemy.mesh.position.z < player.position.z - 10) {
            health -= 10;
            updateUI();
            scene.remove(enemy.mesh);
            enemies.splice(i, 1);
            continue;
        }

        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            const distance = enemy.mesh.position.distanceTo(bullet.mesh.position);
            if (distance < 4) {
                // Hit!
                createExplosion(enemy.mesh.position);
                scene.remove(enemy.mesh);
                enemies.splice(i, 1);
                scene.remove(bullet.mesh);
                bullets.splice(j, 1);
                score += 10;
                updateUI();
                break;
            }
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.mesh.position.add(particle.velocity);
        particle.life--;
        particle.mesh.material.opacity = particle.life / 60;
        particle.mesh.material.transparent = true;

        if (particle.life <= 0) {
            scene.remove(particle.mesh);
            particles.splice(i, 1);
        }
    }
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('health').textContent = health;
}

function checkGameOver() {
    if (health <= 0 && gameRunning) {
        gameRunning = false;
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOver').style.display = 'block';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (gameRunning) {
        updatePlayer();

        // Shooting
        if (keys[' '] && Date.now() - lastShotTime > 200) {
            createBullet();
            lastShotTime = Date.now();
        }

        updateBullets();

        // Spawn enemies
        if (Date.now() - lastEnemySpawnTime > 1500) {
            createEnemy();
            lastEnemySpawnTime = Date.now();
        }

        updateEnemies();
        updateParticles();
        checkGameOver();
    }

    renderer.render(scene, camera);
}

function restartGame() {
    // Clean up existing game objects
    scene.children.forEach(child => {
        if (child !== scene.children[0] && child !== scene.children[1]) { // Keep lights
            scene.remove(child);
        }
    });

    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    health = 100;
    gameRunning = true;

    // Recreate player and ground
    scene.children.length = 0;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);
    createPlayer();
    createGround();

    document.getElementById('gameOver').style.display = 'none';
    updateUI();
}

// Start the game
init();
