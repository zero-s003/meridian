import { Vector3 } from 'three';
import { HOTSPOT_ANCHORS } from '../gl/watch/index.js';

const COPY = {
  chamfer: {
    kicker: 'CASE · 01',
    title: '手工倒角',
    body: '表圈与侧翼之间，一条 0.4 毫米的倒角由制表师手持油石推过。它让光在钢上拐了一个弯，也让指尖在边缘处感到安全。',
    en: 'HAND-CHAMFERED EDGE · 0.4 MM',
  },
  lugs: {
    kicker: 'CASE · 01',
    title: '一体式表耳',
    body: '表耳不是焊在表壳上的零件，而是从同一块钢料中车出。表带因此贴合腕骨，而不是悬在腕上。',
    en: 'INTEGRATED LUGS · 316L STEEL',
  },
  crown: {
    kicker: 'CASE · 01',
    title: '旋入式表冠',
    body: '表冠旋入时压紧两道防水胶圈。上弦之前先旋开它——这是佩戴者与机芯之间的一次握手。',
    en: 'SCREW-DOWN CROWN',
  },
  sunray: {
    kicker: 'DIAL · 02',
    title: '日辉纹表盘',
    body: '720 道细纹以表盘中心为轴旋出。转动腕表时，光沿着这些纹路流动，像一片被风压平的麦田。',
    en: 'SUNRAY DIAL · 720 RAYS',
  },
  indices: {
    kicker: 'DIAL · 02',
    title: '立体时标',
    body: '十二枚 18K 玫瑰金时标独立倒角后镶贴。它们不是印刷，而是十二个微小的金属块，在蓝宝石下投下自己的影子。',
    en: '18K ROSE GOLD APPLIED INDICES',
  },
  seconds: {
    kicker: 'DIAL · 02',
    title: '小秒盘',
    body: '中央秒针被取消，秒数移到底部的小盘。时间因此安静下来——只有靠近看，才听得见它在走。',
    en: 'SMALL SECONDS AT SIX',
  },
  knurling: {
    kicker: 'CROWN · 03',
    title: '抛光表冠',
    body: '表冠以 316L 精钢车成，端面嵌一枚 18K 玫瑰金圆顶。每一次上弦，拇指都会先触到它。',
    en: 'POLISHED CROWN · 18K CABOCHON',
  },
  cabochon: {
    kicker: 'CROWN · 03',
    title: '旋入式防水',
    body: '表冠内侧压着两道防水胶圈，旋紧后达到 50 米防水。它的职责不是防水，而是让你放心地每天为它上弦。',
    en: 'SCREW-DOWN · 50 M WATER RESISTANT',
  },
  bridge: {
    kicker: 'CALIBRE · 04',
    title: '日内瓦纹桥板',
    body: '桥板以黄铜切削，再以旋转木轮拉出日内瓦纹。每一道纹路的方向都由制表师决定，因此没有任何两块桥板完全相同。',
    en: 'CÔTES DE GENÈVE BRIDGES',
  },
  balance: {
    kicker: 'CALIBRE · 04',
    title: '摆轮与游丝',
    body: '摆轮每秒摆动 6 次，游丝把每一次摆动拉回中心。72 小时的从容，就藏在这个不到 7 毫米的圆圈里。',
    en: 'BALANCE WHEEL · 21,600 VPH',
  },
  jewels: {
    kicker: 'CALIBRE · 04',
    title: '宝石轴承',
    body: '21 枚合成红宝石以极小公差压入轴孔，成为齿轮的落脚点。它们不发光，但决定了这枚机芯能走多久。',
    en: '21 SYNTHETIC RUBY JEWELS',
  },
};

export function initHotspots({ camera }) {
  const layer = document.getElementById('hotspots');
  const dialog = document.getElementById('hotspot-dialog');
  const closeButton = document.getElementById('hs-close');
  const kicker = document.getElementById('hs-kicker');
  const title = document.getElementById('hs-title');
  const body = document.getElementById('hs-body');
  const english = document.getElementById('hs-en');

  const records = [];
  const mobileQuery = window.matchMedia('(max-width: 767px)');

  Object.entries(HOTSPOT_ANCHORS).forEach(([chapter, anchors]) => {
    anchors.forEach((anchor) => {
      const data = COPY[anchor.id];
      if (!data) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hotspot';
      button.hidden = true;
      button.innerHTML = `
        <span class="hotspot__dot" aria-hidden="true"></span>
        <span class="hotspot__line" aria-hidden="true"></span>
        <span class="hotspot__label">${data.title}</span>
      `;
      button.addEventListener('click', () => {
        kicker.textContent = data.kicker;
        title.textContent = data.title;
        body.textContent = data.body;
        english.textContent = data.en;
        dialog.showModal();
      });
      layer.append(button);
      records.push({
        chapter: Number(chapter),
        button,
        position: new Vector3(...anchor.position),
        explode: anchor.explode || 0,
      });
    });
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  const world = new Vector3();

  function update(active, explode) {
    const mobile = mobileQuery.matches;
    const width = window.innerWidth;
    const height = window.innerHeight;

    records.forEach((record) => {
      if (record.chapter !== active) {
        record.button.classList.remove('is-visible');
        record.button.hidden = true;
        return;
      }

      world.copy(record.position);
      world.z -= explode * record.explode;
      world.project(camera);

      const visible =
        world.z < 1 &&
        world.x > -0.96 &&
        world.x < 0.96 &&
        world.y > -0.9 &&
        world.y < 0.92;

      if (!visible) {
        record.button.classList.remove('is-visible');
        record.button.hidden = true;
        return;
      }

      const x = (world.x * 0.5 + 0.5) * width;
      const y = (-world.y * 0.5 + 0.5) * height;

      if (mobile && y > height * 0.62) {
        record.button.classList.remove('is-visible');
        record.button.hidden = true;
        return;
      }

      record.button.hidden = false;
      record.button.style.left = `${x}px`;
      record.button.style.top = `${y}px`;
      record.button.classList.toggle('is-flip', x > width * 0.62);
      record.button.classList.add('is-visible');
    });
  }

  return { update };
}
