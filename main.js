import kaboom from "kaboom";

// =============================================================================
// KABOOM INITIALIZATION & CONFIG
// =============================================================================
const k = kaboom({
    global: true,
    scale: 2.5, // Adjusted for better viewing on various screens
    background: [0, 0, 0],
    touchToMouse: true, // Emulate mouse events from touch
    canvas: document.body, // Attach canvas directly to body
});

// =============================================================================
// ASSET LOADING
// =============================================================================
// Player sprite sheet: 32x32px total, 2x2 grid of 16x16 frames
loadSprite("player", "player.png", {
    sliceX: 2,
    sliceY: 2,
    anims: {
        idle: { from: 0, to: 0 },
        walk: { from: 0, to: 3, loop: true, speed: 8 },
    },
});

// Tileset sprite sheet: 64x32px total, 4x2 grid of 16x16 tiles
loadSpriteAtlas("tileset.png", {
    "floor": { x: 0, y: 0, width: 16, height: 16 },
    "wall_top": { x: 16, y: 0, width: 16, height: 16 },
    "terminal": { x: 32, y: 0, width: 16, height: 16 },
    "scroll": { x: 48, y: 0, width: 16, height: 16 },
    "ada_logo": { x: 0, y: 16, width: 16, height: 16 },
    "wall_mid": { x: 16, y: 16, width: 16, height: 16 },
    "book": { x: 32, y: 16, width: 16, height: 16 },
    "altar": { x: 48, y: 16, width: 16, height: 16 },
});

loadSound("interact", "interact.mp3");

// =============================================================================
// DIALOG & UI MANAGEMENT
// =============================================================================
const dialogText = document.getElementById("dialog-text");
const textboxContainer = document.getElementById("textbox-container");
const closeButton = document.getElementById("close-button");
let dialogs = [];
let currentDialog = 0;
let isDialogOpen = false;
let onDialogEnd = null;

function showDialog(messages, onEnd) {
    dialogs = messages;
    currentDialog = 0;
    isDialogOpen = true;
    onDialogEnd = onEnd || null;
    dialogText.innerText = dialogs[currentDialog];
    textboxContainer.classList.remove("hidden");
    const player = get("player")[0];
    if (player) player.paused = true;
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
    const player = get("player")[0];
    if (player) player.paused = false;
    if (onDialogEnd) onDialogEnd();
}

closeButton.addEventListener("click", nextDialog);
onKeyPress("space", nextDialog);

// =============================================================================
// INTERACTION DATA
// =============================================================================
const interactions = {
    'i': {
        messages: [
            "Welcome, Code Wizard! This land is shaped by Ada, a powerful and readable language. Let's begin our journey.",
            "This practical walkthrough was created upon joining AdaCore. I chose to develop a small Ada program that generates animated rosettas as SVG files. These are technically hypotrochoid curves, like from a Spirograph™ toy.",
            "We’ll show that Ada can be fun and easy to learn. Although famous for safety-critical systems, we'll use it as a modern, general-purpose programming language. Let's dive in!"
        ]
    },
    'h': {
        messages: [
            "A brief note on Ada: It was created in the late 1970s for the U.S. Department of Defense to unify its software landscape.",
            "Ada is a general-purpose language but excels in fields where software correctness and reliability are mission-critical: Aerospace, defense, rail, and automotive.",
            "Its design philosophy prioritizes: Readability over conciseness, Strong and explicit typing, Explicit over implicit actions, and having the Compiler as a partner to help you write correct code."
        ]
    },
    't': {
        messages: [
            "Tooling & Setup: To build and run Ada projects, I used Alire, the Ada package manager, similar to Cargo for Rust or npm for JavaScript.",
            "For your development environment, you can use GNAT Studio or the official Ada & SPARK extension for Visual Studio Code.",
            "The program is simple to run from the command-line: ./bin/rosetta"
        ]
    },
    'e': {
        messages: [
            "Entry Point: The main procedure is the start of our program.",
            "```ada\nwith Rosetta_Renderer;\n\nprocedure Main is\nbegin\n   Rosetta_Renderer.Put_SVG_Rosettas;\nend Main;\n```",
            "The `with` clause is a compiled, checked reference to another package, not a simple text include like in C. This prevents many common bugs.",
            "Notice the clear `begin` and `end` keywords instead of `{}`. Readability is a core principle in Ada."
        ]
    },
    'p': {
        messages: [
            "Geometry and Computation (package Rosetta): In Ada, a package is a modular unit grouping related types and functions. It's split into a specification (.ads) and a body/implementation (.adb).",
            "The Rosetta package specification defines the data types: `Hypotrochoid`, `Coordinate`, and `Coordinate_Array`. It's responsible only for the math, not for drawing.",
            "A `record` in Ada is like a `struct` in C. It groups related data. `Hypotrochoid` groups all geometric parameters into a single, cohesive unit.",
        ]
    },
    'c': {
        messages: [
            "Highlights from `rosetta.adb`: Both `Generate_Point` and `Compute_Points` are pure functions that operate only on their inputs. Their behavior is deterministic and encapsulated.",
            "Array handling is safe. `Points : Coordinate_Array (0 .. Curve.Steps)` creates an array with safe bounds. Accessing an index outside this range raises a runtime error, preventing memory corruption.",
            "Using `constant` for variables like `Pi`, `R_Diff` ensures they cannot be accidentally changed, making the code safer and clearer."
        ]
    },
    'r': {
        messages: [
            "Outputting to SVG (package Rosetta_Renderer): This package handles producing the final SVG output. It defines a single high-level procedure: `Put_SVG_Rosettas`.",
            "This separation of concerns is key: the math logic doesn't know about SVG, and the renderer doesn't care how the coordinates were generated.",
            "The `Put_Path` procedure takes an array of coordinates and writes the corresponding SVG path string using `M` (moveto) for the first point and `L` (lineto) for the rest."
        ]
    },
    'a': {
        messages: [
            "This interactive experience is based on a blog post by Romain Gora from AdaCore.",
            "AdaCore provides tools and expertise for safe, secure, and high-reliability software development.",
            "Credit: https://blog.adacore.com/introduction-to-ada-a-project-based-exploration-with-rosettas"
        ]
    }
};

// =============================================================================
// GAME SCENE
// =============================================================================
scene("main", () => {
    const TILE_SIZE = 16;
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
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        tiles: {
            "f": () => [sprite("floor"), "floor"],
            "w": () => [sprite("wall_mid"), area(), solid(), "wall"],
            "@": () => [sprite("player"), area({ scale: 0.75 }), solid(), body(), "player"],
            "i": () => [sprite("book"), area(), solid(), "interactive", { id: 'i' }],
            "h": () => [sprite("scroll"), area(), solid(), "interactive", { id: 'h' }],
            "t": () => [sprite("terminal"), area(), solid(), "interactive", { id: 't' }],
            "e": () => [sprite("scroll"), area(), solid(), "interactive", { id: 'e' }],
            "p": () => [sprite("book"), area(), solid(), "interactive", { id: 'p' }],
            "c": () => [sprite("book"), area(), solid(), "interactive", { id: 'c' }],
            "r": () => [sprite("altar"), area(), solid(), "interactive", { id: 'r' }],
            "a": () => [sprite("ada_logo"), area(), solid(), "interactive", { id: 'a' }],
        }
    };

    const gameLevel = addLevel(map, levelConf);

    // Visual enhancement: Change top-row walls to "wall_top" sprite
    get("wall").forEach(w => {
        const wallAbove = get("wall").find(other => other.pos.y < w.pos.y && other.pos.x === w.pos.x);
        if (!wallAbove) {
            w.use(sprite("wall_top"));
        }
    });

    const player = get("player")[0];
    player.play("idle");
    player.paused = false;

    // --- PLAYER MOVEMENT ---
    const MOVE_SPEED = 120;
    
    onKeyDown(["left", "a"], () => {
        if (player.paused) return;
        player.flipX = true;
        player.move(-MOVE_SPEED, 0);
        if (player.curAnim() !== "walk") player.play("walk");
    });
    onKeyDown(["right", "d"], () => {
        if (player.paused) return;
        player.flipX = false;
        player.move(MOVE_SPEED, 0);
        if (player.curAnim() !== "walk") player.play("walk");
    });
    onKeyDown(["up", "w"], () => {
        if (player.paused) return;
        player.move(0, -MOVE_SPEED);
        if (player.curAnim() !== "walk") player.play("walk");
    });
    onKeyDown(["down", "s"], () => {
        if (player.paused) return;
        player.move(0, MOVE_SPEED);
        if (player.curAnim() !== "walk") player.play("walk");
    });

    onKeyRelease(["left", "right", "up", "down", "a", "d", "w", "s"], () => {
        // Only stop animation if no other movement key is pressed
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
        if (!isDialogOpen && lastInteraction) {
            const data = interactions[lastInteraction.id];
            if (data) {
                showDialog(data.messages);
            }
        }
    });

    // --- CAMERA ---
    player.onUpdate(() => {
        camPos(player.pos);
    });
});

// =============================================================================
// GAME START
// =============================================================================
const startScreen = document.getElementById("intro-screen");
const startButton = document.getElementById("start-button");

startButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    go("main");
});