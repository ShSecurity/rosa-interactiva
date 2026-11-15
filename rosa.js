'use strict';
const canvas=document.querySelector('#garden'),ctx=canvas.getContext('2d',{alpha:true});
const plant=document.createElement('canvas');plant.width=1000;plant.height=1300;
let c=plant.getContext('2d');
const leafCache=new Map();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let moving=!reduced,opening=.85,target=.85,pointer=0,w=0,h=0,dpr=1,last=0,age=0;
const slider=document.querySelector('#bloom');
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=w*dpr;canvas.height=h*dpr;}
addEventListener('resize',()=>{resize();paint();});resize();
addEventListener('pointermove',e=>{pointer=(e.clientX/w-.5)*2;});
addEventListener('pointerleave',()=>pointer=0);
slider.addEventListener('input',()=>{target=+slider.value/100;if(!moving){opening=target;drawPlant();paint();}});
function path(points,stroke,width){c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
function stem(){
 let g=c.createLinearGradient(478,0,504,0);g.addColorStop(0,'#142e13');g.addColorStop(.35,'#668748');g.addColorStop(.58,'#3e6530');g.addColorStop(1,'#122b1b');
 c.beginPath();c.moveTo(485,1148);c.bezierCurveTo(519,888,460,615,503,405);c.lineTo(515,405);c.bezierCurveTo(471,620,532,890,493,1148);c.closePath();c.fillStyle=g;c.fill();
 path([[488,1135],[503,975],[498,800],[494,650],[506,445]],'#a4b07733',1.1);
 const spines=[ [.22,-1,12],[.33,1,15],[.43,-1,17],[.56,1,14],[.67,-1,16],[.79,1,12],[.89,-1,11] ];
 for(const [t,side,size] of spines){
  const edge=side<0?[485,519,460,503]:[493,532,471,515];
  const q=1-t,x=q*q*q*edge[0]+3*q*q*t*edge[1]+3*q*t*t*edge[2]+t*t*t*edge[3];
  const y=q*q*q*1148+3*q*q*t*888+3*q*t*t*615+t*t*t*405;
  const dx=3*q*q*(edge[1]-edge[0])+6*q*t*(edge[2]-edge[1])+3*t*t*(edge[3]-edge[2]);
  const dy=3*q*q*(888-1148)+6*q*t*(615-888)+3*t*t*(405-615);
  // Le repère suit la tangente du bord : base soudée, pointe recourbée vers le bas.
  c.save();c.translate(x,y);c.rotate(Math.atan2(-dx,-dy));
  c.beginPath();c.moveTo(-side*1.6,-size*.38);
  c.bezierCurveTo(side*size*.35,-size*.32,side*size*.69,size*.1,side*size,size*.68);
  c.bezierCurveTo(side*size*.40,size*.42,side*size*.15,size*.56,-side*1.6,size*.35);
  c.closePath();let shade=c.createLinearGradient(0,-size*.4,side*size,size*.68);
  shade.addColorStop(0,'#527342');shade.addColorStop(.55,'#6c7550');shade.addColorStop(1,'#705044');c.fillStyle=shade;c.fill();
  c.beginPath();c.moveTo(side*1,-size*.25);c.quadraticCurveTo(side*size*.45,-size*.08,side*size*.82,size*.48);c.strokeStyle='#b0b58b55';c.lineWidth=.65;c.stroke();c.restore();
 }
}
function leaf(x,y,angle,length,width){
 c.save();c.translate(x,y);c.rotate(angle);
 // Dentado del limbo: la punta queda alineada con el eje horizontal.
 let outline=new Path2D();outline.moveTo(0,0);
 for(let i=1;i<=32;i++){let t=i/32,s=Math.sin(Math.PI*t),serration=(i%2?1:.91);outline.lineTo(t*length,-width*Math.pow(s,.85)*serration*(.82+.18*t));}
 for(let i=31;i>=0;i--){let t=i/32,s=Math.sin(Math.PI*t);outline.lineTo(t*length,width*.84*Math.pow(s,.85)*(i%2?1:.91));}outline.closePath();
 let g=c.createLinearGradient(0,-width,length*.2,width);g.addColorStop(0,'#183b2c');g.addColorStop(.42,'#47764c');g.addColorStop(.5,'#6b8b4c');g.addColorStop(.52,'#254f32');g.addColorStop(1,'#102b22');c.fillStyle=g;c.fill(outline);
 c.save();c.clip(outline);
 // Cutícula: reflejo ancho y tenue, sin aspecto plástico.
 let sheen=c.createRadialGradient(length*.45,-width*.3,1,length*.45,-width*.3,length*.58);
 sheen.addColorStop(0,'#c3d8a025');sheen.addColorStop(1,'#a9ce8f00');c.fillStyle=sheen;c.fillRect(0,-width,length,width*2);
 for(let i=0;i<160;i++){
  const t=hash(i*3.7+length),v=(hash(i*9.1+angle)*2-1)*width;
  c.fillStyle=i%3?'#d8e5ab0b':'#071e1818';c.fillRect(t*length,v,.65,.7);
 }
 for(let i=1;i<12;i++){let t=i/13,xx=t*length;for(let s of [-1,1]){c.beginPath();c.moveTo(xx,0);c.quadraticCurveTo(xx+length*.04,s*width*.25,xx+length*.12,s*width*Math.sin(t*Math.PI)*.95);c.strokeStyle='#b7c58430';c.lineWidth=.9;c.stroke();
  for(let b=1;b<4;b++){let q=b/4;c.beginPath();c.moveTo(xx+length*.1*q,s*width*Math.sin(t*Math.PI)*q*.8);c.quadraticCurveTo(xx+length*(.1*q+.035),s*width*Math.sin(t*Math.PI)*(q+.12),xx+length*(.1*q+.065),s*width*Math.sin(t*Math.PI)*(q+.21));c.strokeStyle='#b5d89b18';c.lineWidth=.45;c.stroke();}
 }}
 c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(length*.6,-3,length,0);c.strokeStyle='#a3b674aa';c.lineWidth=1.7;c.stroke();
 c.restore();c.strokeStyle='#92a36540';c.lineWidth=.7;c.stroke(outline);c.restore();
}
function branch(x,y,tx,ty){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo((x+tx)/2,y-10,tx,ty);c.strokeStyle='#3a6036';c.lineWidth=5;c.stroke();c.strokeStyle='#a5b47255';c.lineWidth=1;c.stroke();}
// Cada hoja compuesta nace en un nudo del tallo. Los folíolos laterales
// salen de puntos calculados sobre el raquis, sin bases flotantes.
const sprays=[
 {base:[502,706],control:[566,679],tip:[649,600],phase:.5,leaves:[[1,-.55,151,42],[.64,-1.52,112,32],[.60,.46,115,33]]},
 {base:[507,859],control:[403,813],tip:[309,744],phase:2.1,leaves:[[1,-2.58,143,40],[.65,-1.64,112,32],[.61,2.39,108,32]]},
 {base:[505,1020],control:[560,982],tip:[613,926],phase:3.8,leaves:[[1,-.64,118,33],[.56,-1.60,87,25],[.53,.40,91,26]]}
];
function leafTexture(length,width){
 const key=length+':'+width;if(leafCache.has(key))return leafCache.get(key);
 const tex=document.createElement('canvas');tex.width=Math.ceil(length+20);tex.height=Math.ceil(width*2+20);
 const previous=c;c=tex.getContext('2d');leaf(10,width+10,0,length,width);
 dew(length*.66+10,width+10-width*.15,2.1);dew(length*.72+10,width+10-width*.12,.85);
 c=previous;leafCache.set(key,tex);return tex;
}
function foldedLeaf(x,y,angle,length,width,phase){
 const tex=leafTexture(length,width);
 const wind=Math.sin(age*.92+phase)*.65+Math.sin(age*1.63+phase*.7)*.22+pointer*.3;
 const bend=length*(.035+wind*.095),curl=.86+Math.sin(age*.73+phase)*.09;
 c.save();c.translate(x,y);c.rotate(angle+wind*.035);
 const strips=40,step=length/strips;
 // La base queda inmóvil; la flexión y la torsión crecen hacia la punta.
 for(let i=0;i<strips;i++){
  const t=(i+.5)/strips,xx=t*length,yy=bend*t*t;
  const tangent=Math.atan2(2*bend*t,length),cross=1-(1-curl)*Math.sin(t*Math.PI*.85);
  c.save();c.translate(xx,yy);c.rotate(tangent);c.scale(1,cross);
  c.drawImage(tex,10+i*step,0,step+.6,tex.height,-step/2,-width-10,step+.6,tex.height);
  c.restore();
 }
 c.restore();
}
function foliage(){
 for(const spray of sprays){
  const y=spray.base[1],phase=spray.phase;
  // Eje real del tallo Bézier, en lugar de una coordenada aproximada.
  let low=0,high=1;
  const cubic=(t,a,b,d,e)=>(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*d+t**3*e;
  for(let i=0;i<18;i++){const t=(low+high)/2;if(cubic(t,1148,888,615,405)>y)low=t;else high=t;}
  const tStem=(low+high)/2;
  const x=(cubic(tStem,485,519,460,503)+cubic(tStem,493,532,471,515))/2;
  const gust=Math.sin(age*.92+phase)*3+pointer*2;
  const tx=spray.tip[0]+gust,ty=spray.tip[1]+Math.sin(age*.81+phase)*3;
  const qx=spray.control[0]+gust*.4,qy=spray.control[1];
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(qx,qy,tx,ty);
  c.strokeStyle='#315332';c.lineWidth=3.5;c.stroke();c.strokeStyle='#9eb77a66';c.lineWidth=.8;c.stroke();
  // Petit renflement naturel à la jonction du pétiole et du tronc.
  c.beginPath();c.ellipse(x,y,4,7,-.3,0,Math.PI*2);c.fillStyle='#527044';c.fill();
  for(const [t,a,l,b] of spray.leaves){
   const ox=(1-t)**2*x+2*(1-t)*t*qx+t*t*tx;
   const oy=(1-t)**2*y+2*(1-t)*t*qy+t*t*ty;
   const reach=t===1?10:13,lx=ox+Math.cos(a)*reach,ly=oy+Math.sin(a)*reach;
   c.beginPath();c.moveTo(ox,oy);c.lineTo(lx,ly);c.strokeStyle='#648253';c.lineWidth=1.8;c.stroke();
   foldedLeaf(lx,ly,a,l,b,phase+t*2+a);
  }
 }
}
// Superficies tridimensionales de pétalos, ordenadas de atrás hacia delante.
function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function point(t,u,angle,ring){
 const spread=.24+.76*opening,outer=ring/4;
 const radius=5+outer*13+t*(13+outer*90)*spread;
 const width=(.48+outer*.13)*Math.pow(Math.sin(t*Math.PI*.82),.72);
 const a=angle+u*width+.035*Math.sin(t*4+angle)*t;
 const lip=Math.pow(Math.max(0,(t-.76)/.24),2)*(6+outer*11)*opening;
 const scallop=(Math.sin(u*5.2+angle)*1.4+Math.sin(u*11-angle)*.55)*Math.pow(t,5);
 const fold=Math.sin(u*8+angle)*.85*Math.sin(t*Math.PI)*outer;
 const yy=ring*1.8+t*(83-outer*27)-Math.pow(u,2)*(5+outer*15)*Math.pow(t,1.2)-lip+scallop+fold;
 return [Math.sin(a)*(radius+lip),yy,Math.cos(a)*(radius+lip)];
}
function project(p){return [510+p[0]*2.05,444-(p[1]*.86-p[2]*.51)*2.05,p[2]*.86+p[1]*.51];}
function bloom(){
 let faces=[];const rows=21,cols=15;
 for(let ring=4;ring>=0;ring--){let count=[5,6,8,10,11][ring];
 for(let n=0;n<count;n++){let a=n/count*Math.PI*2+ring*1.59;
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){
  let t0=j/rows,t1=(j+1)/rows,u0=k/cols*2-1,u1=(k+1)/cols*2-1;
  let ps=[point(t0,u0,a,ring),point(t1,u0,a,ring),point(t1,u1,a,ring),point(t0,u1,a,ring)];
  let dx=ps[1].map((v,i)=>v-ps[0][i]),dy=ps[3].map((v,i)=>v-ps[0][i]);
  let no=[dx[1]*dy[2]-dx[2]*dy[1],dx[2]*dy[0]-dx[0]*dy[2],dx[0]*dy[1]-dx[1]*dy[0]],len=Math.hypot(...no)||1;
  let light=Math.abs((no[0]*-.55+no[1]*.7+no[2]*.45)/len);
  let edge=Math.pow(t1,7),velvet=Math.sin((u0+1)*45+t0*8+a)*.55;
  let lum=8+light*22+edge*9-ring*.3+velvet+Math.min(1,t1*4)*3;
  let hue=347+light*7+hash(n+ring*19)*5;
  let proj=ps.map(project);
  faces.push({ps:proj,z:proj.reduce((s,p)=>s+p[2],0)/4,color:`hsl(${hue} ${70-edge*9}% ${lum}%)`,rim:j===rows-1,light});
 }}}
 faces.sort((a,b)=>a.z-b.z);
 for(let f of faces){c.beginPath();c.moveTo(f.ps[0][0],f.ps[0][1]);for(let i=1;i<4;i++)c.lineTo(f.ps[i][0],f.ps[i][1]);c.closePath();c.fillStyle=f.color;c.strokeStyle=f.color;c.lineWidth=.55;c.fill();c.stroke();
  if(f.rim){c.beginPath();c.moveTo(f.ps[1][0],f.ps[1][1]);c.lineTo(f.ps[2][0],f.ps[2][1]);c.strokeStyle=`rgba(255,157,175,${.08+f.light*.19})`;c.lineWidth=.8;c.stroke();}
 }
}
function sepal(){for(let i=0;i<5;i++){let a=i/5*Math.PI*2;let x=510+Math.sin(a)*14,y=452+Math.cos(a)*5;c.beginPath();c.moveTo(x-9,y);c.quadraticCurveTo(x+Math.sin(a)*32,y-14,x+Math.sin(a)*58,y-55);c.quadraticCurveTo(x+Math.sin(a)*28,y+10,x+7,y+12);c.fillStyle=i%2?'#2c5130':'#426641';c.fill();}}
function dew(x,y,r){c.save();c.shadowColor='#0009';c.shadowBlur=r*.65;c.shadowOffsetY=r*.7;let g=c.createRadialGradient(x-r*.35,y-r*.4,.1,x,y,r);g.addColorStop(0,'#e8ffe6cc');g.addColorStop(.27,'#a6d3ba15');g.addColorStop(.7,'#031f2966');g.addColorStop(1,'#c9e7d0aa');c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,r*1.28,-.3,0,Math.PI*2);c.fill();c.restore();c.fillStyle='#fff9';c.beginPath();c.arc(x-r*.25,y-r*.45,r*.19,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(x+r*.15,y+r*.75,r*.45,r*.16,-.3,0,Math.PI*2);c.fillStyle='#d9f4de66';c.fill();}
function drawPlant(){c.clearRect(0,0,1000,1300);stem();sepal();bloom();
 // Una gota sobre la cara del pétalo exterior, que sigue su apertura.
 if(opening>.45){const p=project(point(.89,.15,.20,4));dew(p[0],p[1],3.4);}
}
function paint(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);let scale=Math.min(h/1230,w/(w<700?870:1250));let cx=w<700?w*.48:w*.58,by=h*.98;ctx.save();ctx.translate(cx,by);ctx.rotate(Math.sin(age*.65)*.008+Math.sin(age*1.15)*.003);ctx.scale(scale,scale);ctx.translate(-500,-1200);ctx.drawImage(plant,0,0);const previous=c;c=ctx;foliage();c=previous;ctx.restore();}
function frame(now){if(now-last>40&&!document.hidden){let dt=Math.min((now-last)/1000,.1);last=now;if(moving)age+=dt;let changed=Math.abs(target-opening)>.002;if(changed){opening+=(target-opening)*Math.min(1,dt*3);drawPlant();}if(moving||changed)paint();}requestAnimationFrame(frame);}
drawPlant();paint();requestAnimationFrame(frame);
