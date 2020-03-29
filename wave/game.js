if (!GameGlobal.window) {
  GameGlobal.window = {};
}

const createts = require('./createts.min')
createts.Runtime.setRuntimeType('wechat_mini_game');
const canvas = createts.Runtime.get().getGameCanvas();
canvas.width = canvas.width * 2;
canvas.height = canvas.height * 2;

let stage = new createts.Stage(canvas, { fps: 60, style: { background: "#000" } });
const parser = new createts.HtmlParser();
let html = "";
for (let i = 0; i < 25; ++i) {
  const size = (i + 1) * 12 + 90;
  html += `
      <div style='alpha:${1 - i * 0.02};position:absolute;composite-operation:lighter;box-sizing:border-box;
      margin:${-size / 2} 0 0 ${-size / 2};width:${size};height:${size};border:45px solid #113355;
      border-radius:50%;color:#fff;'></div>`;
}

const children = parser.parse(html);
stage.addChildren(...children);
for (const child of children) {
  child.style.transformX = createts.BaseValue.of(
    (Math.random() - 0.5) * 800
  );
  child.style.transformY = createts.BaseValue.of(
    (Math.random() - 0.5) * 800
  );
  stage.animate(child, true)
    .to(
      { transformX: 400, transformY: 400 },
      300 + 300 * Math.random(),
      "quadInOut"
    );
}
stage.start();

const delay = new createts.Delay(200);

stage.on(["move", 'pressup'], e => {
  const x = e.x || 0;
  const y = e.y || 0;
  delay.call(() => {
    delay.pause();
    let i = 0;
    const color = createts.Color.random();
    let promises = [];
    for (const child of children) {
      promises.push(
        stage.animate(child, true)
          .to(
            {
              transformX: x,
              transformY: y,
              border: "45px solid " + color.toString()
            },
            (0.5 + i++ * 0.04) * 1500,
            "bounceOut"
          ).toPromise());
    }
    Promise.all(promises).then(() => {
      delay.resume();
    });
  });
}).on('leave', e => {
  delay.cancel();
});