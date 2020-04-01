const createts = require('./createts.min')
createts.Runtime.setRuntimeType('wechat_mini_program');

Page({
  data: {
    stage: undefined,
  },

  ontouchstart: function(e) {
    if (!this.data.stage) return;
    createts.Runtime.get().handleTouchEvent('touchstart', this.data.stage, e);
  },

  ontouchmove: function(e) {
    if (!this.data.stage) return;
    createts.Runtime.get().handleTouchEvent('touchmove', this.data.stage, e);
  },

  ontouchend: function(e) {
    if (!this.data.stage) return;
    createts.Runtime.get().handleTouchEvent('touchend', this.data.stage, e);
  },

  ontouchcancel: function(e) {
    if (!this.data.stage) return;
    createts.Runtime.get().handleTouchEvent('touchcancel', this.data.stage, e);
  },

  onLoad: function () {
    const query = wx.createSelectorQuery()
    query.select('#demo')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.clientWidth = res[0].width;
        canvas.clientHeight = res[0].height;
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr

        createts.Runtime.get().setWxCanvas(canvas);

        let stage = new createts.Stage(canvas, {
          fps: 60,
          style: {
            background: `no-repeat center/cover url(./background.jpg)`
          }
        });
        let html = `
          <div style='pointer-events:none;width:100%;height:60;position:absolute;left:20;top:20;'>
            <text style='font-size:64;color:rgba(255,255,255,.6);font-family:tahoma' id='time'>00:00</text>
          </div>
          <div style='pointer-events:none;width:80%;height:60;margin:-30 0 0 0;border-radius:30;position:absolute;left:10%;top:50%;background:#bbbb;'>
            <div id=ball style='width:60;height:60;border-radius:30;position:absolute;box-sizing:border-box;left:0;top:0;background:#f05754ee;border:4px solid #f05754'>
            </div>
          </div>
          <div style='width:100%;margin:80 0 0 0;position:absolute;left:0;top:50%;text-align:center;'>
            <img src='./start.png' style='width:200;height:69;' id='start' />
          </div>
        `;
        for (let i = 0; i < 20; ++i) {
          html += `<div style='width:60;height:60;position:absolute;left:0;top:-100;background:url(./virus.png);background-size:100% 100%;'></div>`;
        }
        stage.load(html).start();
        const viruses = [];
        for (let i = stage.children.length - 20; i < stage.children.length; ++i) {
          viruses.push(stage.children[i]);
        }

        let isEnd = true;
        let startTime = 0;
        this.data.stage = stage;

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
          for (const v of viruses) {
            restart(v);
          }
          stage.findById('start').css({
            display: 'none'
          });
        }

        function stop() {
          isEnd = true;
          const promises = [];
          for (const v of viruses) {
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
          for (const v of viruses) {
            const pt = v.localToGlobal(30, 30);
            if ((pt1.x - pt.x) * (pt1.x - pt.x) + (pt1.y - pt.y) * (pt1.y - pt.y) < 3600) {
              stop();
              return;
            }
          }
        });
      });
  },
})
