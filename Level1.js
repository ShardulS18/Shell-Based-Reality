// Initialize the terminal with cursor options
const terminal = new Terminal({
    cursorBlink: true,    
    cursorStyle: 'block', 
    fontSize: 14,         
    fontFamily: 'monospace' 
});
terminal.open(document.getElementById('terminal-container'));  

// Display a welcome message
terminal.write("Welcome to the Mystical Forest!\r\nIf any doubts refer to the commands given in the hoverbar.\r\nIf you feel lost use 'pwd' command to point to\r\npresent working directory\r\n$ ");

// Set up a command buffer to capture input
let commandBuffer = "";

// Added initial state
let currentScene = 'initial';
let currentPath = 'forest';
let images = {};
let hasDestroyedShrine = false;
let shrineImageIndex = 1;
let currentSound = null;

// Handle key input in the terminal
terminal.onData((data) => {
    // Convert the input to a character code
    const code = data.charCodeAt(0);

    // Check for arrow keys (up/down)
    if (data === '\x1B[A' || data === '\x1B[B') {
        // Prevent up/down arrow keys from working
        return;
    }

    if (code === 13) { 
        executeCommand(commandBuffer);
        commandBuffer = ""; 
    } 
    else if (code === 127) {
        if (commandBuffer.length > 0) {
            commandBuffer = commandBuffer.slice(0, -1);
            terminal.write("\b \b");
        }
    } 
    else {
        commandBuffer += data;
        terminal.write(data);
    }
});

// Command execution function
function executeCommand(command) {
    terminal.write("\r\n");
    const cmd = command.trim().toLowerCase();
    
    switch(cmd) {
        case 'pwd':
            terminal.write(currentPath + "\r\n");
            break;

        case 'ls':
            showAvailableOptions();
            break;

        case 'cd cave':
            if (currentScene === 'forest') {
                loadCaveScene();
                playSound1('cave');
            } else {
                terminal.write("Cannot access cave from here.\r\n");
            }
            break;

        case 'cd mothertree':
            if (currentScene === 'forest') {
                loadMotherTreeScene();
                playSound1('mothertree_scene');
            } else {
                terminal.write("Cannot access Mother Tree from here.\r\n");
            }
            break;

        case 'cd shrine':
            if (currentScene === 'forest' && !hasDestroyedShrine) {
                loadShrineScene();
                playSound1('shrine')
            } else {
                terminal.write("Location not found.\r\n");
            }
            break;

        case 'cd newpath':
            if (currentScene === 'forest' && hasDestroyedShrine) {
                loadNewPathScene();
            } else {
                terminal.write("Location not found.\r\n");
            }
            break;

        case 'cd ..':
            if (['mothertree', 'cave'].includes(currentScene)) {
                returnToForestScene();
                playSound1('forest_scene');
            } else if(['shrine'].includes(currentScene)){
                returnFromShrineToForest();
                playSound1('forest_scene');
            }else {
                terminal.write("Already in root directory.\r\n");
            }
            break;

        case 'rmdir shrine':
            handleShrineDestruction();
            playSound1('shrine_crumbling');
            break;

        case 'mkdir newpath':
            if (hasDestroyedShrine && currentScene === 'forest') {
                createNewPath();
                playSound1('shrine_bell');
            } else {
                terminal.write("Cannot create new path yet.\r\n");
            }
            break;
            
        case 'clear':
            terminal.clear();
            terminal.scrollToTop();
            terminal.write("Welcome to the Mystical Forest!\r\nIf any doubts refer to the commands given in the hoverbar.\r\nIf you feel lost use 'pwd' command to point to\r\npresent working directory");
            break;

        default:
            terminal.write(`Command not found: ${command}\r\n`);
    }

    terminal.write("\r\n$ ");
}

function showAvailableOptions() {
    switch(currentScene) {
        case 'forest':
            if (!hasDestroyedShrine) {
                terminal.write("Available locations:\r\n- cave (directory)\r\n- mothertree (directory)\r\n- shrine (directory)\r\n");
            } else {
                terminal.write("Available locations:\r\n- cave (directory)\r\n- mothertree (directory)\r\n\r\n" + 
                             (currentPath.includes('newpath') ? "- newpath (directory)\r\n" : ""));
            }
            break;
        case 'cave':
            terminal.write("Nothing to explore here.\r\n");
            break;
        case 'mothertree':
            terminal.write("Nothing to explore here.\r\n");
            break;
        case 'shrine':
            terminal.write("Objective:\r\n1. Destroy forgotten shrine (Try rmdir DIRECTORYNAME)\r\n");
            break;
        default:
            terminal.write("No objects present.\r\n");
    }
}

// Initialize PIXI application and load assets
const app = new PIXI.Application();
app.init({ background: "#000000", resizeTo: window })
  .then(async () => {
    document.getElementById("pixi-container").appendChild(app.view);
    const textures = await loadTextures();
    createSprites(textures);
    loadForestScene();
  });

async function loadTextures() {
    return {
        forest: await PIXI.Assets.load("forestScene.svg"),
        forestObjective: await PIXI.Assets.load("forestObjective.svg"),
        cave1: await PIXI.Assets.load("cave1.svg"),
        cave2: await PIXI.Assets.load("cave2.svg"),
        motherTree: await PIXI.Assets.load("MotherTreeScene.svg"),
        returnForest: await PIXI.Assets.load("returnForest.svg"),
        returnSTF: await PIXI.Assets.load("returnSTF.svg"),
        shrineBackground: await PIXI.Assets.load("shrineBackground.svg"),
        dialogue1: await PIXI.Assets.load("dialogue1.svg"),
        dialogue2: await PIXI.Assets.load("dialogue2.svg"),
        dialogue3: await PIXI.Assets.load("dialogue3.svg"),
        dialogue4: await PIXI.Assets.load("dialogue4.svg"),
        dialogue5: await PIXI.Assets.load("dialogue5.svg"),
        dialogue6: await PIXI.Assets.load("dialogue6.svg"),
        dialogue7: await PIXI.Assets.load("dialogue7.svg"),
        dialogue8: await PIXI.Assets.load("dialogue8.svg"),
        createpathObjective: await PIXI.Assets.load("createpathObjective.svg"),
        shrineObjective: await PIXI.Assets.load("shrineObjective.svg"),
        shrineDestroyed: await PIXI.Assets.load("shrineDestroyed.svg"),
        createPath: await PIXI.Assets.load("createPath.svg"),
        newPath: await PIXI.Assets.load("newPath.svg")
    };
}

function createSprites(textures) {
    // Create sprites for each texture with default properties
    Object.keys(textures).forEach(key => {
        const sprite = new PIXI.Sprite(textures[key]);
        sprite.alpha = 0; // Only set alpha as a default
        app.stage.addChild(sprite);
        images[key] = sprite;
    });

    images.forestObjective.anchor.set(0.4);
    images.forestObjective.scale.set(1.0);
    images.forestObjective.x = app.screen.width / 7;
    images.forestObjective.y = app.screen.height / 15;
    images.forestObjective.alpha = 0;
    images.forestObjective.zIndex = 0;

    images.shrineObjective.anchor.set(0.5);
    images.shrineObjective.scale.set(1.0);
    images.shrineObjective.x = app.screen.width / 1;
    images.shrineObjective.y = app.screen.height / 15;
    images.shrineObjective.alpha = 0;
    images.shrineObjective.zIndex = 0;

    images.createpathObjective.anchor.set(0.5);
    images.createpathObjective.scale.set(1.0);
    images.createpathObjective.x = app.screen.width / 1;
    images.createpathObjective.y = app.screen.height / 15;
    images.createpathObjective.alpha = 0;
    images.createpathObjective.zIndex = 1;

    images.dialogue2.anchor.set(0.5);
    images.dialogue2.scale.set(1.0);
    images.dialogue2.x = app.screen.width / 3;
    images.dialogue2.y = app.screen.height - (images.dialogue2.height / 2);
    images.dialogue2.alpha = 0;
    images.dialogue2.zIndex = 0;

    images.dialogue4.anchor.set(0.5);
    images.dialogue4.scale.set(1.0);
    images.dialogue4.x = app.screen.width / 3;  
    images.dialogue4.y = app.screen.height - (images.dialogue4.height / 2); 
    images.dialogue4.alpha = 0;
    images.dialogue4.zIndex = 0;

    images.dialogue6.anchor.set(0.5);
    images.dialogue6.scale.set(1.0);
    images.dialogue6.x = app.screen.width / 3;
    images.dialogue6.y = app.screen.height - (images.dialogue6.height / 2);
    images.dialogue6.alpha = 0;
    images.dialogue6.zIndex = 0;

    images.dialogue8.anchor.set(0.5);
    images.dialogue8.scale.set(1.0);
    images.dialogue8.x = app.screen.width / 3;
    images.dialogue8.y = app.screen.height - (images.dialogue6.height / 2);
    images.dialogue8.alpha = 0;
    images.dialogue8.zIndex = 1;

    images.dialogue7.anchor.set(0.5);
    images.dialogue7.x = app.screen.width / 3;
    images.dialogue7.y = app.screen.height / 2;
    images.dialogue7.alpha = 0;
    images.dialogue7.zIndex = 1;

    // Scene sprites (bedroom, phone, dining room, etc.)
    const sceneSprites = ['forest', 'motherTree', 'cave1', 'cave2', 'returnForest', 'returnSTF', 'createPath', 'shrineBackground', 'shrineDestroyed', 'dialogue1', 'dialogue3', 'dialogue5'];
    sceneSprites.forEach(key => {
        if (images[key]) {
            images[key].anchor.set(0.5);
            images[key].x = app.screen.width / 3;
            images[key].y = app.screen.height / 2;
            images[key].zIndex = 0;
        }
    });
}

async function initializeSounds1() {
    const backgroundMusic = document.getElementById('backgroundMusic1');
    
    // Optional: Set volume
    backgroundMusic.volume = 0.05;
    
    try {
        // Play the background music
        await backgroundMusic.play();
    } catch (error) {
        console.error('Error playing background music:', error);
    }
}

function playSound1(soundId) {
    // Stop the currently playing sound, if any
    if (currentSound) {
        currentSound.pause();
        currentSound.currentTime = 0; // Reset to the beginning
    }

    // Play the new sound
    currentSound = document.getElementById(soundId);
    if (currentSound) {
        try {
            currentSound.play();
        } catch (error) {
            console.error(`Error playing sound ${soundId}:`, error);
        }
    }
}

function loadForestScene() {
    initializeSounds1();
    playSound1('forest_scene');
    currentScene = 'forest';
    currentPath = 'forest';
    fadeOutAllSprites();
    gsap.to(images.forest, {
        alpha: 1,
        duration: 1,
        onComplete: () => {
            // After bedroom is fully loaded, wait 3 seconds then animate overlay
            setTimeout(() => {
                if (currentScene === 'forest' && images.forestObjective) {
                    // Position the overlay off-screen to the left
                    images.forestObjective.x = -images.forestObjective.width;
                    images.forestObjective.alpha = 1;
                    
                    // Animate it sliding in from the left
                    gsap.to(images.forestObjective, {
                        x: app.screen.width / 6, // Match the position of other scenes
                        duration: 1.5,
                        ease: "power2.out"
                    });
                }
            }, 3000);
        }
    });
}

function loadCaveScene() {
    currentScene = 'cave';
    currentPath = 'forest/cave';
    fadeOutAllSprites();
    gsap.to(images.cave1, {
        alpha: 1,
        duration: 1,
        onComplete: () => {
            setTimeout(() => {
                gsap.to(images.cave1, {
                    alpha: 0,
                    duration: 1,
                    onComplete: () => {
                        gsap.to(images.cave2, {
                            alpha: 1,
                            duration: 1
                        });
                    }
                });
            }, 2000); // Wait 2 seconds before fading out the first scene
        }
    });
}

function loadMotherTreeScene() {
    currentScene = 'mothertree';
    currentPath = 'forest/motherTree';
    fadeOutAllSprites();
    gsap.to(images.motherTree, {
        alpha: 1,
        duration: 1
    });
}

function loadShrineScene() {
    currentScene = 'shrine';
    currentPath = 'forest/shrine';
    fadeOutAllSprites();
    
    // Show shrine images in sequence
    gsap.to(images.shrineBackground, {
        alpha: 1,
        duration: 1,
        onComplete: () => {
            // First dialogue scene
            gsap.to(images.dialogue1, {
                alpha: 1,
                duration: 1,
                onComplete: () => {
                    // Wait for a few seconds
                    setTimeout(() => {
                        // Second dialogue scene loads while first is still visible
                        gsap.to(images.dialogue2, {
                            alpha: 1,
                            duration: 1,
                            onComplete: () => {
                                // Wait for a few seconds
                                setTimeout(() => {
                                    // Fade out first two dialogues
                                    gsap.to([images.dialogue1, images.dialogue2], {
                                        alpha: 0,
                                        duration: 1,
                                        onComplete: () => {
                                            // Third dialogue scene
                                            gsap.to(images.dialogue3, {
                                                alpha: 1,
                                                duration: 1,
                                                onComplete: () => {
                                                    // Wait for a few seconds
                                                    setTimeout(() => {
                                                        // Fourth dialogue scene
                                                        gsap.to(images.dialogue4, {
                                                            alpha: 1,
                                                            duration: 1,
                                                            onComplete: () => {
                                                                // Wait for a few seconds
                                                                setTimeout(() => {
                                                                    // Fade out third and fourth dialogues
                                                                    gsap.to([images.dialogue3, images.dialogue4], {
                                                                        alpha: 0,
                                                                        duration: 1,
                                                                        onComplete: () => {
                                                                            // Fifth dialogue scene
                                                                            gsap.to(images.dialogue5, {
                                                                                alpha: 1,
                                                                                duration: 1,
                                                                                onComplete: () => {
                                                                                    // Wait for a few seconds
                                                                                    setTimeout(() => {
                                                                                        // Sixth dialogue scene
                                                                                        gsap.to(images.dialogue6, {
                                                                                            alpha: 1,
                                                                                            duration: 1,
                                                                                            onComplete: () => {
                                                                                                // Wait for a few seconds after dialogue 6
                                                                                                setTimeout(() => {
                                                                                                    // Position dialogue 7 off-screen to the left
                                                                                                    images.shrineObjective.x = -images.shrineObjective.width;
                                                                                                    images.shrineObjective.alpha = 1;
    
                                                                                                    // Slide dialogue 7 in from the left
                                                                                                    gsap.to(images.shrineObjective, {
                                                                                                        x: app.screen.width / 6, // Match the position of other scenes
                                                                                                        duration: 1.5,
                                                                                                        ease: "power2.out"
                                                                                                    });
                                                                                                }, 3000);
                                                                                            }
                                                                                        });
                                                                                    }, 3000); // Wait 3 seconds after fifth dialogue
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }, 3000); // Wait 3 seconds after fourth dialogue
                                                            }
                                                        });
                                                    }, 3000); // Wait 3 seconds after third dialogue
                                                }
                                            });
                                        }
                                    });
                                }, 3000); // Wait 3 seconds after second dialogue
                            }
                        });
                    }, 3000); // Wait 3 seconds after first dialogue
                }
            });
        }
    });
}

function returnToForestScene() {
    currentScene = 'forest';
    currentPath = 'forest';
    fadeOutAllSprites();
    gsap.to([images.returnForest], {
        alpha: 1,
        duration: 1
    });
    images.forest = images.returnForest;

}
function returnFromShrineToForest() {
    currentScene = 'forest';
    currentPath = 'forest';
    fadeOutAllSprites();
    gsap.to([images.returnSTF], {
        alpha: 1,
        duration: 1
    });
    images.forest = images.returnSTF;
}

function handleShrineDestruction() {
    if (currentScene === 'shrine') {
        terminal.write("You cannot be in the shrine if you want to destroy it.\r\nGet out and then destroy it!\r\n");
    } else if (currentScene === 'forest' && !hasDestroyedShrine) {
        fadeOutAllSprites();
        gsap.to(images.shrineDestroyed, {
            alpha: 1,
            duration: 1,
            onComplete: () => {
                // First dialogue scene
                gsap.to(images.dialogue7, {
                    alpha: 1,
                    duration: 1,
                    onComplete: () => {
                        // Wait for a few seconds
                        setTimeout(() => {
                            // Sixth dialogue scene
                            gsap.to(images.dialogue8, {
                                alpha: 1,
                                duration: 1,
                                onComplete: () => {
                                    // Wait for a few seconds after dialogue 6
                                    setTimeout(() => {
                                        // Position dialogue 7 off-screen to the left
                                        images.createpathObjective.x = -images.createpathObjective.width;
                                        images.createpathObjective.alpha = 1;

                                        // Slide dialogue 7 in from the left
                                        gsap.to(images.createpathObjective, {
                                            x: app.screen.width / 6, // Match the position of other scenes
                                            duration: 1.5,
                                            ease: "power2.out"
                                        });
                                    }, 3000);
                                }
                            });
                        }, 3000); // Wait 3 seconds after fifth dialogue
                    }
                });
            }
        });
        hasDestroyedShrine = true;
        terminal.write("The forgotten shrine has been destroyed.\r\n");
    }
}

function createNewPath() {
    fadeOutAllSprites();
    gsap.to(images.createPath, {
        alpha: 1,
        duration: 1
    });
    currentPath = 'forest/newpath';
    terminal.write("A new path has been created in the forest.\r\n");
}

function loadNewPathScene() {
    currentScene = 'newpath';
    currentPath = 'forest/intoTheUnknown';
    fadeOutAllSprites();
    gsap.to(images.newPath, {
        alpha: 1,
        duration: 1,
        onComplete: () => {
            setTimeout(() => {
                gsap.to(images.newPath, {
                    alpha: 0,
                    duration: 1,
                    onComplete: () => {
                        localStorage.setItem('shellGameCompleted', 'true');
                        window.location.href = 'index.html';
                    }
                });
            }, 5000);
        }
    });
}

function fadeOutAllSprites() {
    Object.values(images).forEach(sprite => {
        gsap.to(sprite, {
            alpha: 0,
            duration: 1
        });
    });
}

// Window resize handler
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    
    Object.values(images).forEach(sprite => {
        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;
    });
});