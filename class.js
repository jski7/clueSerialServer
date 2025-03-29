class stria {
    constructor(colors) {
        this.color = randomColor(colors);
        this.red = this.color[0];
        this.green = this.color[1];
        this.blue = this.color[2];
        this.pos = random();
        this.alpha = 0;
        this.vis = 0;
        this.max_alpha = random(.1,1);
        this.width = random(.1,1) * GRADIENT_QUALITY;
        this.fade_dir = 1;
        this.live = 0;
        this.start = millis();
        this.attack = random(2000,10000);
        this.sustain = random(4000);
        this.release = random(2000,10000);
        this.duration = this.attack + this.sustain +this.release
        this.end = this.start + this.attack + this.sustain + this.release;
        this.kill = false;
        this.speed = random(-1,1) * 0.005;
        this.is_vibrant = chance(0.05);
        this.vibrancy = random(0.8,1.2);
        this.is_strobo = chance(0.8);
    }

    show() {
        this.live = millis() - this.start;
        this.pos = this.pos + this.speed;
        if (this.live <= this.attack) {
            this.vis = (this.live/this.attack);
        }

        if (this.live >= (this.attack + this.sustain)) {
            this.vis = map(this.live, this.attack + this.sustain, this.duration, 1, 0)
        }  

        this.kill = this.end < millis() || this.pos - (this.width/GRADIENT_QUALITY)/2 > 1 || this.pos + this.width/2/GRADIENT_QUALITY < 0
        
        let r,g,b,a, pos_cos;

        for (let c = 0; c <= (this.width/2); c++) {
            let pos_cos = (-(cos((c/this.width)*2*Math.PI - Math.PI)) + 1)/2
            a = pos_cos * this.vis * this.max_alpha * 255;
            // if (this.is_vibrant) {
            //     r = this.red * random(this.vibrancy);
            //     g = this.green * random(this.vibrancy);
            //     b = this.blue * random(this.vibrancy);
            // }
            // else {
                r = this.red;
                g = this.green;
                b = this.blue;
            // }
            // if (this.is_strobo) {
            //     r = this.red * (frameCount % 2);
            //     g = this.green * (frameCount % 2);
            //     b = this.blue * (frameCount % 2);
            // }
            GRADIENT.fill(r, g, b, a)
            if (this.pos * GRADIENT_QUALITY + c <= GRADIENT.width) {
                GRADIENT.rect(floor(this.pos * GRADIENT_QUALITY + c), 0, 1, GRADIENT.height);
                }
            if (this.pos * GRADIENT_QUALITY + c >= 0) {
                GRADIENT.rect(floor(this.pos * GRADIENT_QUALITY - c - 1), 0, 1, GRADIENT.height);
                }
        }
    }
}

var strias = [];

function generateGradient(colors = colors, BLEND = false) {
    GRADIENT.background(0);
    if (BLEND = true) {
        GRADIENT.blendMode(ADD);
    }
    if (chance(0.5) && strias.length < MAX_STRIAS) {
        strias.push(new stria(colors));
    } 
    for (let i = strias.length-1; i >= 0; i--) {
        if (strias[i].kill) {
            strias.splice(i,1);
        }
    }
    for (let s of strias) {
        s.show()
    }
    if (BLEND = true) {
        GRADIENT.blendMode(NORMAL);
    }
        let blackout = 0.5
    for (let i = GRADIENT.width * blackout; i <= GRADIENT.width; i++) {
      GRADIENT.fill(0, 0, 0, map(i, GRADIENT.width * blackout, GRADIENT.width, 0, 255));
      GRADIENT.rect(i,0,1,GRADIENT.height);
    }
}