let ROOT = './';
if (!GameGlobal.window) {
  // in real device, 'window' is not defined, we need define a empty one to satisfy the
  // minimized createts lib.
  // And the image path root is also different, in IDE the root is ./ but in real device
  // it must be /
  ROOT = '/';
  GameGlobal.window = {};
}

const createts = require('./createts.min')

createts.Runtime.setRuntimeType('wechat_mini_game');
const canvas = createts.Runtime.get().getGameCanvas();
canvas.width = canvas.width * 2;
canvas.height = canvas.height * 2;
let stage = new createts.Stage(canvas, {
  fps: 60,
  style: {
    background: `no-repeat center/cover url(${ROOT}background.jpg)`
  }
});
const parser = new createts.HtmlParser();
let html =
  `<div style="width:30%;height:40px;overflow:hidden;border:4px solid rgba(255,255,255,.8);border-radius:24px;position:absolute;left:50%;top:50%;transform: -50% -50%;background:#ffffff;background-clip:content-box;">
    <div id=progress style="width:0;height:40px;background:green;"></div>
   </div>`;
stage.addChildren(...parser.parse(html));
stage.start();
const progress = stage.findById('progress');

createts.ResourceRegistry.DefaultInstance.add(`${ROOT}background.jpg`, createts.ResourceType.IMAGE);
createts.ResourceRegistry.DefaultInstance.add(`${ROOT}start.png`, createts.ResourceType.IMAGE);
createts.ResourceRegistry.DefaultInstance.add(`${ROOT}virus.png`, createts.ResourceType.IMAGE);
createts.ResourceRegistry.DefaultInstance.on('progress', e => {
  progress.css({
    width: e.progress * 100 + '%'
  });
  stage.updateOnce();
}).on('done', _ => {
  progress.parent.remove();
  let html = `
    <div style='pointer-events:none;width:100%;height:60;position:absolute;left:20;top:20;'>
      <text style='font-size:64;color:rgba(255,255,255,.6);font-family:tahoma' id='time'>00:00</text>
    </div>
    <div style='pointer-events:none;width:80%;height:60;margin:-30 0 0 0;border-radius:30;position:absolute;left:10%;top:50%;background:#bbbb;'>
      <div id=ball style='width:60;height:60;border-radius:30;position:absolute;box-sizing:border-box;left:0;top:0;background:#f05754ee;border:4px solid #f05754'>
      </div>
    </div>
    <div style='width:100%;margin:80 0 0 0;position:absolute;left:0;top:50%;text-align:center;'>
      <img src='${ROOT}start.png' style='width:200;height:69;' id='start' />
    </div>
  `;
  const children = parser.parse(html);
  stage.addChildren(...children);

  let isEnd = true;
  let startTime = 0;

  let vhtml = '';
  for (let i = 0; i < 20; ++i) {
    vhtml += `<div style='width:60;height:60;position:absolute;left:0;top:-100;background:url(${ROOT}virus.png);background-size:100% 100%;'></div>`;
  }
  const vs = parser.parse(vhtml);
  stage.addChildren(...vs);

  function restart(child) {
    child.css({
      transformY: -100,
      transformX: Math.random() * canvas.width,
      rotation: 0
    });
    const time = 2000 + Math.random() * 3000;
    stage.animate(child, true).wait(Math.max(0, (Math.random() - 0.3) * 5000)).to({
      transformX: Math.random() * canvas.width,
      transformY: canvas.height + 100,
      rotation: (Math.random() - 0.5) * 10 * 360
    }, time, 'linear').call(e => {
      restart(child)
    });
  }

  function start() {
    isEnd = false;
    stage.animationFactory.clear();
    startTime = Date.now();
    for (const v of vs) {
      restart(v);
    }
    stage.findById('start').css({
      display: 'none'
    });
  }

  function stop() {
    isEnd = true;
    const promises = [];
    for (const v of vs) {
      promises.push(stage.animate(v, true).wait(500).to({
        transformX: Math.random() * canvas.width,
        transformY: canvas.height + 500,
      }, 1000, 'backInOut').toPromise());
    }
    Promise.all(promises).then(() => {
      stage.findById('start').css({
        display: ''
      });
      stage.updateOnce();
    });
  }

  const ball = stage.findById('ball');
  const time = stage.findById('time');
  stage.on(['touchdown', 'pressmove'], e => {
    if (isEnd) return;
    let x = ball.parent.globalToLocal(e.stageX, 0).x - 30;
    x = Math.max(0, x);
    x = Math.min(ball.parent.getContentWidth() - 60, x);
    ball.css({
      left: x
    });
    stage.updateOnce();
  });
  stage.findById('start').on('click', e => {
    start();
  });

  stage.animationFactory.on('update', e => {
    if (isEnd) return;
    let duration = Math.round((Date.now() - startTime) / 10) + '';
    if (duration.length < 4) {
      duration = ('000' + duration).substring(duration.length - 1);
    }
    time.setText(duration.substring(0, duration.length - 2) + ':' + duration.substring(duration.length - 2));

    const pt1 = ball.localToGlobal(30, 30);
    for (const v of vs) {
      const pt = v.localToGlobal(30, 30);
      if ((pt1.x - pt.x) * (pt1.x - pt.x) + (pt1.y - pt.y) * (pt1.y - pt.y) < 3600) {
        stop();
        return;
      }
    }
  });
});

stage.start();