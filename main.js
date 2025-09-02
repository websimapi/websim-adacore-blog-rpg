import kaboom from "kaboom";

// Initialize Kaboom
const k = kaboom({
    global: true,
    scale: 2,
    background: [0, 0, 0],
    root: document.querySelector("#game-container"),
    touchToMouse: true, // Enable touch controls on mobile
});

// --- ASSET LOADING ---
loadRoot("assets/");
loadSprite("player", "player.png", {
    sliceX: 4,
    anims: {
        idle: { from: 0, to: 0 },
        down: { from: 0, to: 3, loop: true, speed: 8 },
        left: { from: 0, to: 3, loop: true, speed: 8 },
        right: { from: 0, to: 3, loop: true, speed: 8 },
        up: { from: 0, to: 3, loop: true, speed: 8 },
    },
});
loadSpriteAtlas("tileset.png", {
    "floor": { x: 0, y: 0, width: 16, height: 16 },
    "wall_top": { x: 16, y: 0, width: 16, height: 16 },
    "wall_mid": { x: 16, y: 16, width: 16, height: 16 },
    "ada_logo": { x: 0, y: 16, width: 16, height: 16 },
    "terminal": { x: 32, y: 0, width: 16, height: 16 },
    "book": { x: 32, y: 16, width: 16, height: 16 },
    "scroll": { x: 48, y: 0, width: 16, height: 16 },
    "altar": { x: 48, y: 16, width: 16, height: 16 },
});
loadSound("interact", "interact.mp3");

// --- DIALOG UI HANDLING ---
const dialogText = document.getElementById("dialog-text");
const textboxContainer = document.getElementById("textbox-container");
const closeButton = document.getElementById("close-button");

let dialogs = [];
let currentDialog = 0;
let isDialogOpen = false;

function showDialog(messages) {
    dialogs = messages;
    currentDialog = 0;
    isDialogOpen = true;
    dialogText.innerText = dialogs[currentDialog];
    textboxContainer.classList.remove("hidden");
    player.paused = true; // Freeze player
}

function nextDialog() {
    if (!isDialogOpen) return;
    play("interact");
    currentDialog++;
    if (currentDialog >= dialogs.length) {
        closeDialog();
    } else {
        dialogText.innerText = dialogs[currentDialog];
    }
}

function closeDialog() {
    isDialogOpen = false;
    textboxContainer.classList.add("hidden");
    if(player) player.paused = false; // Unfreeze player
}

closeButton.addEventListener("click", nextDialog);
onKeyPress("space", nextDialog);

// --- INTERACTION DATA ---
const interactions = {
    'i': { // Intro book
        messages: [
            "Welcome, Code Wizard! This land is shaped by Ada, a powerful and readable language. Let's begin our journey.",
            "This practical walkthrough was created upon joining AdaCore. I chose to develop a small Ada program that generates animated rosettas as SVG files. These are technically hypotrochoid curves, like from a Spirograph™ toy.",
            "We’ll show that Ada can be fun and easy to learn. Although famous for safety-critical systems, we'll use it as a modern, general-purpose programming language. Let's dive in!"
        ]
    },
    'h': { // History scroll
        messages: [
            "A brief note on Ada: It was created in the late 1970s for the U.S. Department of Defense to unify its software landscape.",
            "Ada is a general-purpose language but excels in fields where software correctness and reliability are mission-critical: Aerospace, defense, rail, and automotive.",
            "Its design philosophy prioritizes: Readability over conciseness, Strong and explicit typing, Explicit over implicit actions, and having the Compiler as a partner to help you write correct code."
        ]
    },
    't': { // Tooling terminal
        messages: [
            "Tooling & Setup: To build and run Ada projects, I used Alire, the Ada package manager, similar to Cargo for Rust or npm for JavaScript.",
            "For your development environment, you can use GNAT Studio or the official Ada & SPARK extension for Visual Studio Code.",
            "The program is simple to run from the command-line: ./bin/rosetta"
        ]
    },
    'e': { // Entry point scroll
        messages: [
            "Entry Point: The main procedure is the start of our program.",
            "```ada\nwith Rosetta_Renderer;\n\nprocedure Main is\nbegin\n   Rosetta_Renderer.Put_SVG_Rosettas;\nend Main;\n```",
            "The `with` clause is a compiled, checked reference to another package, not a simple text include like in C. This prevents many common bugs.",
            "Notice the clear `begin` and `end` keywords instead of `{}`. Readability is a core principle in Ada."
        ]
    },
    'p': { // Rosetta package book
        messages: [
            "Geometry and Computation (package Rosetta): In Ada, a package is a modular unit grouping related types and functions. It's split into a specification (.ads) and a body/implementation (.adb).",
            "The Rosetta package specification defines the data types: `Hypotrochoid`, `Coordinate`, and `Coordinate_Array`. It's responsible only for the math, not for drawing.",
            "A `record` in Ada is like a `struct` in C. It groups related data. `Hypotrochoid` groups all geometric parameters into a single, cohesive unit.",
            "The `Coordinate_Array` is an unconstrained array. Its size is defined when you create an object of that type, making it flexible."
        ]
    },
    'c': { // Rosetta code book
        messages: [
            "Highlights from `rosetta.adb`: Both `Generate_Point` and `Compute_Points` are pure functions that operate only on their inputs. Their behavior is deterministic and encapsulated.",
            "Array handling is safe. `Points : Coordinate_Array (0 .. Curve.Steps)` creates an array with safe bounds. Accessing an index outside this range raises a runtime error, preventing memory corruption.",
            "Using `constant` for variables like `Pi`, `R_Diff` ensures they cannot be accidentally changed, making the code safer and clearer."
        ]
    },
    'r': { // Renderer Altar
        messages: [
            "Outputting to SVG (package Rosetta_Renderer): This package handles producing the final SVG output. It defines a single high-level procedure: `Put_SVG_Rosettas`.",
            "This separation of concerns is key: the math logic doesn’t know about SVG, and the renderer doesn’t care how the coordinates were generated.",
            "The `Put_Path` procedure takes an array of coordinates and writes the corresponding SVG path string using `M` (moveto) for the first point and `L` (lineto) for the rest."
        ]
    },
    'a': { // AdaCore Logo
        messages: [
            "This interactive experience is based on a blog post by Romain Gora from AdaCore.",
            "AdaCore provides tools and expertise for safe, secure, and high-reliability software development.",
            "Credit: https://blog.adacore.com/introduction-to-ada-a-project-based-exploration-with-rosettas"
        ]
    }
};

// --- GAME SCENE ---
scene("main", () => {
    const map = [
        "wwwwwwwwwwww",
        "w f  t h  fw",
        "w f       fw",
        "w  e     c w",
        "w          w",
        "w i   @  p w",
        "w          w",
        "w   f  rf  w",
        "w   f  af  w",
        "wwwwwwwwwwww",
    ];

    const levelConf = {
        width: 16,
        height: 16,
        pos: vec2(60, 40),
        "f": () => [sprite("floor"), area(), "floor"],
        "w": () => [sprite("wall_mid"), area(), solid(), "wall"],
        "@": () => [sprite("player"), area({width: 12, height: 12}), solid(), body(), "player"],
        "i": () => [sprite("book"), area(), solid(), "interactive", { id: 'i' }],
        "h": () => [sprite("scroll"), area(), solid(), "interactive", { id: 'h' }],
        "t": () => [sprite("terminal"), area(), solid(), "interactive", { id: 't' }],
        "e": () => [sprite("scroll"), area(), solid(), "interactive", { id: 'e' }],
        "p": () => [sprite("book"), area(), solid(), "interactive", { id: 'p' }],
        "c": () => [sprite("book"), area(), solid(), "interactive", { id: 'c' }],
        "r": () => [sprite("altar"), area(), solid(), "interactive", { id: 'r' }],
        "a": () => [sprite("ada_logo"), area(), solid(), "interactive", { id: 'a' }],
    };

    addLevel(map, levelConf);

    // Replace top walls for better visual
    get("wall").forEach(w => {
        if (!get("wall").some(other => other.pos.y < w.pos.y && other.pos.x === w.pos.x)) {
            w.use(sprite("wall_top"));
        }
    });
     // Replace all floor tiles
    addLevel(map.map(row => row.replace(/[^w]/g, 'f')), levelConf);

    const player = get("player")[0];
    player.play("idle");
    player.paused = false;

    // --- PLAYER MOVEMENT ---
    const MOVE_SPEED = 120;

    onKeyDown(["left", "a"], () => {
        if(player.paused) return;
        player.flipX(true);
        player.move(-MOVE_SPEED, 0);
        player.play("left");
    });
    onKeyDown(["right", "d"], () => {
        if(player.paused) return;
        player.flipX(false);
        player.move(MOVE_SPEED, 0);
        player.play("right");
    });
    onKeyDown(["up", "w"], () => {
        if(player.paused) return;
        player.move(0, -MOVE_SPEED,);
        player.play("up");
    });
    onKeyDown(["down", "s"], () => {
        if(player.paused) return;
        player.move(0, MOVE_SPEED);
        player.play("down");
    });
    
    onKeyRelease(["left", "right", "up", "down", "a", "d", "w", "s"], () => {
        if (!isKeyDown("left") && !isKeyDown("right") && !isKeyDown("up") && !isKeyDown("down") && !isKeyDown("a") && !isKeyDown("d") && !isKeyDown("w") && !isKeyDown("s")) {
            player.play("idle");
        }
    });

    // --- INTERACTION LOGIC ---
    let lastInteraction = null;
    player.onCollide("interactive", (obj) => {
        lastInteraction = obj;
    });
    player.onCollideEnd("interactive", (obj) => {
        if (lastInteraction === obj) {
            lastInteraction = null;
        }
    });
    
    onKeyPress("space", () => {
        if (isDialogOpen) {
            // nextDialog is already handled globally
        } else if (lastInteraction) {
            play("interact");
            const data = interactions[lastInteraction.id];
            if (data) {
                showDialog(data.messages);
            }
        }
    });

    // Camera follows player
    player.onUpdate(() => {
        camPos(player.pos);
    });
});

// --- GAME START ---
const startScreen = document.getElementById("intro-screen");
const startButton = document.getElementById("start-button");

startButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    go("main");
});