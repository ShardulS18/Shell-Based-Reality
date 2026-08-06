const terminalContainer = document.getElementById("terminal-container");
const pixiContainer = document.getElementById("pixi-container");

let terminal = null;
let app = null;
let images = {};
let currentScene = "initial";
let currentSound = null;
let commandBuffer = "";

if (!window.Terminal || !terminalContainer) {
  console.error("Xterm failed to load or the terminal container is missing.");
} else {
  terminal = new window.Terminal({
    cursorBlink: true,
    cursorStyle: "block",
    fontSize: 14,
    fontFamily: "monospace",
  });

  terminal.open(terminalContainer);
  terminal.write(
    "Welcome to the dream portal!\r\nIf any doubts refer to the commands given in the hoverbar.\r\nType 'start' to begin.\r\n$ "
  );

  terminal.onData((data) => {
    const code = data.charCodeAt(0);

    if (data === "\x1B[A" || data === "\x1B[B") {
      return;
    }

    if (code === 13) {
      executeCommand(commandBuffer);
      commandBuffer = "";
    } else if (code === 127) {
      if (commandBuffer.length > 0) {
        commandBuffer = commandBuffer.slice(0, -1);
        terminal.write("\b \b");
      }
    } else {
      commandBuffer += data;
      terminal.write(data);
    }
  });
}

function executeCommand(command) {
  if (!terminal) {
    return;
  }

  terminal.write("\r\n");

  switch (command.trim().toLowerCase()) {
    case "start":
      if (currentScene === "initial") {
        terminal.write(
          "Starting your journey...\r\nUse ls command to list where you can go or what you can use\r\n"
        );
        showLighthouseScene();
        playSound("ocean_waves");
      }
      break;

    case "whoami":
      if (currentScene === "lighthouse-moved") {
        terminal.write("Initiating self-discovery...\r\n");
        showQuote();
      }
      break;

    case "ls":
      switch (currentScene) {
        case "lighthouse-moved":
          terminal.write("You are in a dream type 'whoami' command to proceed.\r\n");
          break;
        case "bedroom":
          terminal.write(
            "Available options:\r\n- dining room (directory)\r\n- washroom (directory)\r\n- phone (file)\r\n"
          );
          break;
        case "dining-room":
          terminal.write("Need to brush teeth first.\r\n");
          break;
        case "washroom":
          terminal.write("Available options:\r\n- brush teeth (file)\r\n");
          break;
        default:
          terminal.write("No options available.\r\n");
      }
      break;

    case "cat phone":
      if (currentScene === "bedroom") {
        loadPhoneScene();
        playSound("phone_pickup");
      }
      break;

    case "q":
      if (currentScene === "phone") {
        returnToBedroomScene();
      }
      break;

    case "cd dining room":
      if (currentScene === "bedroom") {
        loadDiningRoomScene();
        playSound("footsteps_level0");
      }
      break;

    case "cd washroom":
      if (currentScene === "bedroom") {
        loadWashroomScene();
        playSound("footsteps_to_washroom");
        playSound("water_running");
      }
      break;

    case "cat brush teeth":
      if (currentScene === "washroom") {
        loadPortalScene();
        playSound("portal_opening");
      }
      break;

    case "cd ..":
      if (["dining-room"].includes(currentScene)) {
        returnToBedroomScene();
        playSound("footsteps_level0");
      } else if (["washroom"].includes(currentScene)) {
        returnToBedroomScene();
        playSound("footsteps_to_washroom");
      }
      break;

    case "clear":
      terminal.clear();
      terminal.scrollToTop();
      terminal.write(
        "Welcome to the dream portal!\r\nIf any doubts refer to the commands given in the hoverbar."
      );
      break;

    default:
      terminal.write(`Command not found: ${command}\r\n`);
  }

  terminal.write("\r\n$ ");
}

async function initPixi() {
  if (!window.PIXI || !pixiContainer) {
    console.error("Pixi failed to load or the container is missing.");
    return;
  }

  app = new window.PIXI.Application();
  await app.init({ background: "#000000", resizeTo: window });
  pixiContainer.appendChild(app.view);

  const textures = await loadTextures();
  createSprites(textures);
}

async function loadTextures() {
  return {
    lighthouse: await PIXI.Assets.load("Lighthouse.svg"),
    background: await PIXI.Assets.load("Background.svg"),
    boy: await PIXI.Assets.load("Boy.svg"),
    clouds: await PIXI.Assets.load("Clouds.svg"),
    rock: await PIXI.Assets.load("Rock.svg"),
    backgroundrock: await PIXI.Assets.load("BackgroundRock.svg"),
    backgroundrock2: await PIXI.Assets.load("BackgroundRock2.svg"),
    bedroom: await PIXI.Assets.load("BedroomScene.svg"),
    phone: await PIXI.Assets.load("PhoneScene.svg"),
    diningRoom: await PIXI.Assets.load("DiningRoom.svg"),
    washroom: await PIXI.Assets.load("WashroomScene.svg"),
    portal: await PIXI.Assets.load("PortalScene.svg"),
    quote: await PIXI.Assets.load("QuoteScene.svg"),
    bedroomObjective: await PIXI.Assets.load("bedroomObjective.svg"),
    returnBedroom: await PIXI.Assets.load("BedroomScene2.svg"),
  };
}

function createSprites(textures) {
  Object.keys(textures).forEach((key) => {
    const sprite = new PIXI.Sprite(textures[key]);
    sprite.alpha = 0;
    app.stage.addChild(sprite);
    images[key] = sprite;
  });

  if (images.background) {
    images.background.anchor.set(0.5);
    images.background.scale.set(1.0);
    images.background.x = app.screen.width / 3;
    images.background.y = app.screen.height / 2;
    images.background.zIndex = 0;
  }

  if (images.lighthouse) {
    images.lighthouse.anchor.set(0.2);
    images.lighthouse.scale.set(0.7);
    images.lighthouse.x = app.screen.width / 13;
    images.lighthouse.y = app.screen.height / 5;
    images.lighthouse.zIndex = 2;
  }

  if (images.backgroundrock) {
    images.backgroundrock.anchor.set(0.5);
    images.backgroundrock.scale.set(1.0);
    images.backgroundrock.x = app.screen.width / 4;
    images.backgroundrock.y = app.screen.height / 1.63;
    images.backgroundrock.zIndex = 1;
  }

  if (images.boy) {
    images.boy.anchor.set(0.45);
    images.boy.x = app.screen.width / 2;
    images.boy.y = app.screen.height / 2;
    images.boy.zIndex = 3;
  }

  if (images.clouds) {
    images.clouds.anchor.set(0.5);
    images.clouds.x = app.screen.width / 2.5;
    images.clouds.y = app.screen.height / 2.5;
    images.clouds.zIndex = 0;
  }

  if (images.rock) {
    images.rock.anchor.set(0.45);
    images.rock.x = app.screen.width / 20;
    images.rock.y = app.screen.height / 1.1;
    images.rock.zIndex = 3;
  }

  if (images.backgroundrock2) {
    images.backgroundrock2.anchor.set(0.45);
    images.backgroundrock2.x = app.screen.width / 10;
    images.backgroundrock2.y = app.screen.height / 1.1;
    images.backgroundrock2.zIndex = 2;
  }

  if (images.bedroomObjective) {
    images.bedroomObjective.anchor.set(0.5);
    images.bedroomObjective.scale.set(1.0);
    images.bedroomObjective.x = app.screen.width / 1;
    images.bedroomObjective.y = app.screen.height / 15;
    images.bedroomObjective.alpha = 0;
    images.bedroomObjective.zIndex = 0;
  }

  ["bedroom", "phone", "diningRoom", "washroom", "portal", "quote", "returnBedroom"].forEach((key) => {
    if (images[key]) {
      images[key].anchor.set(0.5);
      images[key].x = app.screen.width / 3;
      images[key].y = app.screen.height / 2;
      images[key].zIndex = 0;
    }
  });
}

async function initializeSounds() {
  const backgroundMusic = document.getElementById("backgroundMusic0");
  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.volume = 0.1;

  try {
    await backgroundMusic.play();
  } catch (error) {
    console.error("Error playing background music:", error);
  }
}

function playSound(soundId) {
  if (currentSound) {
    currentSound.pause();
    currentSound.currentTime = 0;
  }

  currentSound = document.getElementById(soundId);
  if (currentSound) {
    try {
      currentSound.play();
    } catch (error) {
      console.error(`Error playing sound ${soundId}:`, error);
    }
  }
}

function showLighthouseScene() {
  currentScene = "lighthouse";

  Object.values(images).forEach((sprite) => {
    if (sprite) {
      sprite.alpha = 0;
    }
  });

  ["lighthouse", "background", "boy", "clouds", "backgroundrock", "rock", "backgroundrock2"].forEach((element) => {
    if (images[element]) {
      gsap.to(images[element], { alpha: 1, duration: 1, ease: "power1.inOut" });
    }
  });

  setTimeout(() => {
    if (currentScene === "lighthouse") {
      animateTransition();
    }
  }, 3000);
}

function showQuote() {
  currentScene = "quote";

  ["lighthouse", "background", "boy", "clouds", "backgroundrock", "rock", "backgroundrock2"].forEach((element) => {
    if (images[element]) {
      gsap.to(images[element], { alpha: 0, duration: 1, ease: "power1.inOut" });
    }
  });

  if (images.quote) {
    images.quote.anchor.set(0.5);
    images.quote.x = app.screen.width / 3;
    images.quote.y = app.screen.height / 2;

    gsap.to(images.quote, { alpha: 1, duration: 1, ease: "power1.inOut" });

    setTimeout(() => {
      if (currentScene === "quote") {
        gsap.to(images.quote, {
          alpha: 0,
          duration: 1,
          ease: "power1.inOut",
          onComplete: () => loadBedroomScene(),
        });
      }
    }, 5000);
  }
}

function animateTransition() {
  if (currentScene === "lighthouse") {
    gsap.to([images.clouds, images.lighthouse], { x: "-=40", duration: 3 });
    gsap.to([images.boy, images.rock], { x: "+=40", duration: 3 });
    currentScene = "lighthouse-moved";
  }
}

function loadBedroomScene() {
  playSound("alarm_clock");
  initializeSounds();
  currentScene = "bedroom";

  ["phone", "diningRoom", "washroom", "portal"].forEach((scene) => {
    if (images[scene]) {
      gsap.to(images[scene], { alpha: 0, duration: 1 });
    }
  });

  if (images.bedroom) {
    gsap.to(images.bedroom, {
      alpha: 1,
      duration: 1,
      onComplete: () => {
        setTimeout(() => {
          if (currentScene === "bedroom" && images.bedroomObjective) {
            images.bedroomObjective.x = -images.bedroomObjective.width;
            images.bedroomObjective.alpha = 1;
            gsap.to(images.bedroomObjective, {
              x: app.screen.width / 6,
              duration: 1.5,
              ease: "power2.out",
            });
          }
        }, 3000);
      },
    });
  }
}

function returnToBedroomScene() {
  currentScene = "bedroom";

  ["phone", "diningRoom", "washroom", "portal", "bedroom"].forEach((scene) => {
    if (images[scene]) {
      gsap.to(images[scene], { alpha: 0, duration: 1 });
    }
  });

  if (images.returnBedroom && images.bedroomObjective) {
    gsap.to([images.returnBedroom, images.bedroomObjective], { alpha: 1, duration: 1 });
    images.bedroom = images.returnBedroom;
  }
}

function loadPhoneScene() {
  currentScene = "phone";

  if (images.bedroom && images.bedroomObjective) {
    gsap.to([images.bedroom, images.bedroomObjective], {
      alpha: 0,
      duration: 1,
      onComplete: () => {
        if (images.phone) {
          gsap.to(images.phone, { alpha: 1, duration: 1 });
        }
      },
    });
  }
}

function loadDiningRoomScene() {
  currentScene = "dining-room";

  if (images.bedroom && images.bedroomObjective) {
    gsap.to([images.bedroom, images.bedroomObjective], { alpha: 0, duration: 1 });
  }

  if (images.diningRoom) {
    gsap.to(images.diningRoom, { alpha: 1, duration: 1 });
  }
}

function loadWashroomScene() {
  currentScene = "washroom";

  if (images.bedroom && images.bedroomObjective) {
    gsap.to([images.bedroom, images.bedroomObjective], { alpha: 0, duration: 1 });
  }

  if (images.washroom) {
    gsap.to(images.washroom, { alpha: 1, duration: 1 });
  }
}

function loadPortalScene() {
  currentScene = "portal";

  if (images.washroom) {
    gsap.to(images.washroom, {
      alpha: 0,
      duration: 1,
      onComplete: () => {
        if (images.portal) {
          gsap.to(images.portal, {
            alpha: 1,
            duration: 0.5,
            onComplete: () => {
              setTimeout(() => {
                window.location.href = "console2.html";
              }, 1000);
            },
          });
        }
      },
    });
  }

  terminal.write("WHOAAAAAAA\r\n");
}

window.addEventListener("resize", () => {
  if (app) {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    Object.values(images).forEach((sprite) => {
      if (sprite) {
        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;
      }
    });
  }
});

initPixi();
