/* Calculator data and formulas. Page text lives in content/*.md. Edit numbers and formulas here, then run: node build.js */
const n=(v,d=2)=>Number(v).toLocaleString('en-AU',{maximumFractionDigits:d}),up=v=>Math.ceil(v-1e-9);
const R=(v)=>v.l*v.w+(Number(v.l2||0)*Number(v.w2||0));
const M=(v)=>R(v)*v.d/1000*(1+v.x/100);
const META={
 "concrete": {
  "nm": "Concrete",
  "h": "Concrete Calculator Australia",
  "t": "Concrete Calculator Australia | How Much Concrete Do I Need?",
  "md": "Free concrete calculator for slabs, paths and driveways. Work out cubic metres and how many 20kg or 40kg bags you need.",
  "ld": "Find out how much concrete you need for a slab, path or driveway, in cubic metres and in bags."
 },
 "gravel": {
  "nm": "Gravel",
  "h": "Gravel Calculator Australia",
  "t": "Gravel Calculator Australia | How Much Gravel Do I Need?",
  "md": "Free gravel calculator for driveways and paths. Works for road base, crusher dust, blue metal and crushed rock. Get m³ and tonnes.",
  "ld": "Work out how much gravel you need in cubic metres and tonnes. Works for road base, crusher dust and blue metal too."
 },
 "soil": {
  "nm": "Soil",
  "h": "Soil Calculator Australia",
  "t": "Soil Calculator Australia | Topsoil and Garden Soil Quantity",
  "md": "Free soil calculator for garden beds, lawns and pots. Find how much topsoil you need in m³, tonnes and 30 litre bags.",
  "ld": "Find out how much soil or topsoil you need for garden beds, lawns and raised planters."
 },
 "mulch": {
  "nm": "Mulch",
  "h": "Mulch Calculator Australia",
  "t": "Mulch Calculator Australia | How Much Mulch Do I Need?",
  "md": "Free mulch calculator. Estimate how much mulch you need for garden beds in cubic metres and 30 litre bags.",
  "ld": "Estimate how much mulch you need for your garden beds, in cubic metres and bags."
 },
 "paint": {
  "nm": "Paint",
  "h": "Paint Calculator Australia",
  "t": "Paint Calculator Australia | How Much Paint Do I Need?",
  "md": "Free paint calculator. Work out how many litres of paint you need for walls and ceilings, and which tin sizes to buy.",
  "ld": "Work out how many litres of paint you need for a room, and which tin sizes to buy."
 },
 "tile": {
  "nm": "Tile",
  "h": "Tile Calculator Australia",
  "t": "Tile Calculator Australia | How Many Tiles Do I Need?",
  "md": "Free tile calculator for floors, bathrooms and walls. Enter your area, tile size and grout gap to see how many tiles to buy.",
  "ld": "Find out how many tiles you need for a floor, wall or bathroom, including grout gaps and waste."
 },
 "brick": {
  "nm": "Brick",
  "h": "Brick Calculator Australia",
  "t": "Brick Calculator Australia | How Many Bricks Per m2?",
  "md": "Free brick calculator. Work out how many bricks you need for a wall, plus bricks per m2, standard brick size in Australia and courses.",
  "ld": "Work out how many bricks or blocks you need for a wall, including openings and waste."
 },
 "screed": {
  "nm": "Screed",
  "h": "Screed Calculator Australia",
  "t": "Screed Calculator Australia | Sand and Cement for Floor Screed",
  "md": "Free screed calculator. Work out the volume of floor screed and how much sand and cement you need for your mix ratio.",
  "ld": "Find out how much screed, sand and cement you need to level a floor."
 },
 "lineal": {
  "nm": "Lineal metre",
  "h": "Lineal Metre Calculator",
  "t": "Lineal Metre Calculator | Convert Square Metres to Lineal Metres",
  "md": "Free lineal metre calculator. Convert square metres to linear metres for flooring, decking and fabric using the board width.",
  "ld": "Convert square metres to lineal metres for flooring, decking boards or fabric. You only need the board width."
 }
};
/* ---- Shared helpers for the repeatable area / room / wall groups ---- */
const PI=Math.PI,sum=(list,fn)=>list.reduce((t,x)=>t+fn(x),0),money=x=>"$"+Number(x).toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2});
const areaOf=it=>it.shape==="circle"?PI*it.dia*it.dia/4:it.shape==="tri"?it.base*it.ht/2:it.a*it.b;
const totalArea=v=>sum(v.areas,areaOf);
const areaGroup=(a,b,title)=>({title:title||"Areas",item:"Area",add:"Add another area",max:12,
fields:[NAME_F,["shape","Shape",[["Rectangle","rect"],["Circle","circle"],["Triangle","tri"]],0],
["a","Length","m",a,{shape:["rect"]},1],["b","Width","m",b,{shape:["rect"]},1],
["dia","Diameter","m",2,{shape:["circle"]},1],["base","Base","m",3,{shape:["tri"]},1],["ht","Perpendicular height","m",2,{shape:["tri"]},1]],
defaults:[{shape:"rect",a:a,b:b}]});
const BAGS_L=[["25 litre",25],["30 litre",30],["40 litre",40],["50 litre",50],["Custom size",-1]];
const bagField=(id,opts,def,unit)=>[[id,"Bag size",opts,def],[id+"c","Custom bag size",unit,30,{[id]:["-1"]},1]];
const bagSize=(v,id)=>v[id]===-1?v[id+"c"]:v[id];
const costFields=bases=>{const on=bases.slice(1).map(b=>String(b[1]));return[["pr","Cost estimate (optional)",bases,0],["price","Price","$",0,{pr:on}],["fee","Delivery fee","$",0,{pr:on}]]};
const costRow=(v,qty)=>{if(v.pr==="none"||!(v.price>0))return null;const base=qty[v.pr];if(!(base>0))return null;return["Estimated material cost",money(v.price*base+v.fee),"indicative only, not a supplier quote"]};
const al=v=>v.xs===-1?v.x:v.xs;
const allowFields=(label,def)=>[["xs",label,[["No allowance",0],["5%",5],["10%",10],["15%",15],["Custom percentage",-1]],def],["x","Custom allowance","%",10,{xs:["-1"]}]];
const named=(it,i,p)=>((it.name||"").trim())||p+" "+(i+1);
const NAME_F=["name","Name (optional)","@text",""];
const byItem=(list,p,fn)=>list.length>1?list.map((it,i)=>fn(it,named(it,i,p),i)):[];
const compact=rows=>rows.filter(Boolean);
const orderStep=(vol,step)=>Math.ceil(vol/step-1e-9)*step;

const NEW_CALCS={
concrete:{...META.concrete,
f:[["@structures"],["x","Extra for waste and uneven ground","%",10],["dens","Concrete density","t/m³",2.4,null,1],
["bag","Bag size (optional)",[["No bag estimate",0],["20 kg bag",20],["30 kg bag",30],["40 kg bag",40]],1],
["yl","Bag yield, litres per bag (0 uses a typical value)","litres",0,{bag:["20","30","40"]}],
...costFields([["Do not estimate cost","none"],["Ready mix price per m³","m3"],["Price per bag","bag"]])],
g:{structures:{title:"Concrete structures",item:"Structure",add:"Add another structure",max:12,
fields:[NAME_F,["type","Type of structure",[["Slab, path, patio or driveway","slab"],["Square footing","sqfoot"],["Circular footing or post hole","circfoot"],["Strip footing","strip"],["Circular column","column"],["Wall","wall"],["Steps","steps"]],0],
["sl_l","Length","m",5,{type:["slab"]},1],["sl_w","Width","m",3,{type:["slab"]},1],["sl_t","Thickness","mm",100,{type:["slab"]},1],
["sf_s","Side length","mm",400,{type:["sqfoot"]},1],["sf_d","Depth","mm",600,{type:["sqfoot"]},1],
["cf_dia","Diameter","mm",300,{type:["circfoot"]},1],["cf_d","Depth","mm",600,{type:["circfoot"]},1],
["st_l","Length","m",10,{type:["strip"]},1],["st_w","Width","mm",450,{type:["strip"]},1],["st_d","Depth","mm",300,{type:["strip"]},1],
["co_dia","Diameter","mm",300,{type:["column"]},1],["co_h","Height","m",2.4,{type:["column"]},1],
["wl_l","Length","m",6,{type:["wall"]},1],["wl_h","Height","m",1,{type:["wall"]},1],["wl_t","Thickness","mm",200,{type:["wall"]},1],
["sp_n","Number of steps","no.",3,{type:["steps"]},1],["sp_w","Step width","m",1.2,{type:["steps"]},1],["sp_r","Rise of each step","mm",170,{type:["steps"]},1],["sp_g","Going (tread depth)","mm",280,{type:["steps"]},1],
["qty","Number of identical items","no.",1,{type:["sqfoot","circfoot","column"]},1]],
defaults:[{type:"slab"}]}},
c:v=>{const vol=it=>{switch(it.type){
case"slab":return it.sl_l*it.sl_w*it.sl_t/1000;
case"sqfoot":return it.qty*(it.sf_s/1000)**2*it.sf_d/1000;
case"circfoot":return it.qty*PI*(it.cf_dia/2000)**2*it.cf_d/1000;
case"strip":return it.st_l*(it.st_w/1000)*(it.st_d/1000);
case"column":return it.qty*PI*(it.co_dia/2000)**2*it.co_h;
case"wall":return it.wl_l*it.wl_h*it.wl_t/1000;
default:return it.sp_w*(it.sp_g/1000)*(it.sp_r/1000)*it.sp_n*(it.sp_n+1)/2}};
const base=sum(v.structures,vol),m=base*(1+v.x/100),perBag=v.bag?(v.yl>0?v.yl:v.bag/2)/1000:0,bags=perBag?up(m/perBag):0;
return[compact([["Concrete needed",n(m)+" m³","including waste allowance"],["Volume before waste",n(base,3)+" m³"],
["Suggested ready mix order",n(orderStep(m,.2),1)+" m³","rounded up to 0.2 m³ steps"],["Estimated weight",n(m*v.dens)+" t","at "+n(v.dens,1)+" t per m³"],
v.bag?[v.bag+" kg bags",n(bags,0),"about "+n(perBag*1000,0)+" litres each"]:null,costRow(v,{m3:m,bag:bags})]).concat(byItem(v.structures,"Structure",(it,nm)=>[nm,n(vol(it)*(1+v.x/100))+" m³"])),
"Bag yield and concrete density vary by product, so check the bag label. Ready mix is ordered in supplier specific steps. This is a planning estimate, not an engineering design."]}},

gravel:{...META.gravel,
f:[["@areas"],["d","Depth","mm",75,null,1],...allowFields("Compaction and waste allowance",3),
["mat","Material",[["Pebbles or 20 mm gravel","peb",{dens:1.5}],["Crushed rock or blue metal","rock",{dens:1.6}],["Road base","road",{dens:1.9}],["Crusher dust","dust",{dens:1.7}],["Sand","sand",{dens:1.6}],["Custom density","custom"]],1],
["dens","Density used","t/m³",1.6,null,1],
...bagField("bag",[["No bag estimate",0],["20 kg bag",20],["25 kg bag",25],["Custom size",-1]],0,"kg"),
...costFields([["Do not estimate cost","none"],["Price per tonne","t"],["Price per m³","m3"],["Price per bag","bag"]])],
g:{areas:areaGroup(6,3)},
c:v=>{const A=totalArea(v),v0=A*v.d/1000,m=v0*(1+al(v)/100),t=m*v.dens,kg=bagSize(v,"bag"),bags=kg>0?up(t*1000/kg):0;
return[compact([["Volume needed",n(m)+" m³","including allowance"],["Volume before allowance",n(v0,3)+" m³"],["Estimated weight",n(t)+" t","at "+n(v.dens,2)+" t per m³"],["Total area",n(A)+" m²"],
kg>0?[n(kg,0)+" kg bags",n(bags,0),"uses the density shown"]:null,costRow(v,{t:t,m3:m,bag:bags})]).concat(byItem(v.areas,"Area",(it,nm)=>[nm,n(areaOf(it)*v.d/1000*(1+al(v)/100))+" m³",n(areaOf(it),1)+" m²"])),
"Supplier specifications for density and delivery weight take priority over these typical values."]}},

soil:{...META.soil,
f:[["@areas"],["d","Depth","mm",150,null,1],...allowFields("Allowance for settling",2),
["mat","Soil type",[["Topsoil","top",{dens:1.3}],["Garden mix","gm",{dens:1.1}],["Lawn underlay","lu",{dens:1.4}],["Vegetable garden mix","veg",{dens:1}],["Compost","comp",{dens:.8}],["Sandy soil","sand",{dens:1.5}],["Fill soil","fill",{dens:1.6}],["Custom density","custom"]],0],
["dens","Density used","t/m³",1.3,null,1],
...bagField("bag",BAGS_L,1,"litres"),
...costFields([["Do not estimate cost","none"],["Price per m³","m3"],["Price per bag","bag"]])],
g:{areas:areaGroup(4,2,"Garden areas")},
c:v=>{const A=totalArea(v),v0=A*v.d/1000,m=v0*(1+al(v)/100),L=bagSize(v,"bag"),bags=up(m*1000/L);
return[compact([["Soil needed",n(m)+" m³","including settling allowance"],["Volume before allowance",n(v0,3)+" m³"],["Suggested order quantity",n(orderStep(m,.5),1)+" m³","rounded up to 0.5 m³ steps"],
["Estimated weight",n(m*v.dens)+" t","at "+n(v.dens,2)+" t per m³"],["Litres",n(m*1000,0)+" L"],[n(L,0)+" litre bags",n(bags,0)],costRow(v,{m3:m,bag:bags})]).concat(byItem(v.areas,"Area",(it,nm)=>[nm,n(areaOf(it)*v.d/1000*(1+al(v)/100))+" m³",n(areaOf(it),1)+" m²"])),
"Soil weight changes with moisture and composition. Confirm density and bag sizes with your supplier."]}},

mulch:{...META.mulch,
f:[["@areas"],["d","Depth","mm",75,null,1],...allowFields("Allowance for settling",2),
...bagField("bag",BAGS_L,1,"litres"),
["veh","Delivery vehicle (optional)",[["Skip load estimate","none",{cap:0}],["Ute tray","ute",{cap:.8}],["Small trailer","small",{cap:1}],["Medium trailer","med",{cap:1.5}],["Large trailer","large",{cap:2}]],0],
["cap","Load capacity (editable)","m³",0,{veh:["ute","small","med","large"]},1],
...costFields([["Do not estimate cost","none"],["Price per m³","m3"],["Price per bag","bag"]])],
g:{areas:areaGroup(5,2,"Garden beds")},
c:v=>{const A=totalArea(v),v0=A*v.d/1000,m=v0*(1+al(v)/100),L=bagSize(v,"bag"),bags=up(m*1000/L),loads=v.veh==="none"?0:up(m/v.cap);
return[compact([["Mulch needed",n(m)+" m³","including allowance"],["Litres",n(m*1000,0)+" L"],[n(L,0)+" litre bags",n(bags,0)],["Suggested order quantity",n(orderStep(m,.5),1)+" m³","rounded up to 0.5 m³ steps"],
v.veh!=="none"?["Loads",n(loads,0),"at "+n(v.cap,1)+" m³ per load"]:null,["Total area",n(A)+" m²"],costRow(v,{m3:m,bag:bags})]).concat(byItem(v.areas,"Area",(it,nm)=>[nm,n(areaOf(it)*v.d/1000*(1+al(v)/100))+" m³",n(areaOf(it),1)+" m²"])),
"Load capacities are typical values. Always stay within your vehicle's payload and towing limits."]}},

paint:{...META.paint,
f:[["@rooms"],["surf","Painting",[["Interior","in",{cv:12}],["Exterior","out",{cv:10}]],0],
["cv","Coverage per litre","m²",12,null,1],["ct","Topcoats","no.",2,null,1],
["cond","Surface condition",[["Smooth, previously painted",0],["Rough or textured (adds 10%)",10],["Porous or unpainted (adds 20%)",20]],0],
["da","Average door area","m²",1.6,null,1],["wa","Average window area","m²",1.5,null,1],
["trw","Skirting and trim width","mm",100,null,1],
["pd","Paint doors as well?",[["No",0],["Yes, both sides",1]],0],
["pm","Primer or preparation coat",[["No primer",0],["Add a primer coat",1]],0],
["pcv","Primer coverage per litre","m²",10,{pm:["1"]},1],["pct","Primer coats","no.",1,{pm:["1"]},1]],
g:{rooms:{title:"Rooms or surfaces",item:"Room",add:"Add another room",max:12,
fields:[NAME_F,["mode","How do you want to enter it?",[["Room length, width and height","room"],["Total wall length and height","perim"]],0],
["rl","Room length","m",4,{mode:["room"]},1],["rw","Room width","m",3,{mode:["room"]},1],["rh","Wall height","m",2.4,{mode:["room"]},1],
["pl","Total wall length","m",14,{mode:["perim"]},1],["ph","Wall height","m",2.4,{mode:["perim"]},1],
["dr","Doors","no.",2],["wn","Windows","no.",2],
["cl","Paint the ceiling?",[["No",0],["Yes",1]],0,{mode:["room"]}],["ca","Ceiling area (0 to skip)","m²",0,{mode:["perim"]}],
["tr","Skirting and trim length (0 to skip)","m",0]],
defaults:[{mode:"room"}]}},
check:v=>v.rooms.map((r,i)=>{const p=r.mode==="room"?2*(r.rl+r.rw):r.pl,h=r.mode==="room"?r.rh:r.ph;return p*h<r.dr*v.da+r.wn*v.wa?"Room "+(i+1)+": door and window areas exceed the wall area. Check the counts and average opening sizes.":null}).filter(Boolean),
c:v=>{let wall=0,ceil=0,trim=0,doorsN=0;v.rooms.forEach(r=>{const p=r.mode==="room"?2*(r.rl+r.rw):r.pl,h=r.mode==="room"?r.rh:r.ph;wall+=p*h-r.dr*v.da-r.wn*v.wa;ceil+=r.mode==="room"?(r.cl?r.rl*r.rw:0):r.ca;trim+=r.tr*v.trw/1000;doorsN+=r.dr});
const f=1+v.cond/100,door=v.pd?doorsN*v.da*2:0,lit=a=>a*f*v.ct/v.cv,lw=lit(wall),lc=lit(ceil),lt=lit(trim+door),L=lw+lc+lt;const roomL=v.rooms.map(r=>{const p=r.mode==="room"?2*(r.rl+r.rw):r.pl,h=r.mode==="room"?r.rh:r.ph,w=p*h-r.dr*v.da-r.wn*v.wa,c=r.mode==="room"?(r.cl?r.rl*r.rw:0):r.ca,t=r.tr*v.trw/1000+(v.pd?r.dr*v.da*2:0);return(w+c+t)*f*v.ct/v.cv});
let r=up(L),t=[];for(const s of[15,10,4,2,1]){const q=Math.floor(r/s);if(q>0){t.push(q+" × "+s+" L");r-=q*s}}
const pr=v.pm?(wall+ceil)*f*v.pct/v.pcv:0;
return[compact([["Paint needed",n(L,1)+" L","topcoat, "+n(v.ct,0)+" coats"],["Paintable area",n((wall+ceil+trim+door)*f,1)+" m²","including surface allowance"],["Walls",n(lw,1)+" L",n(wall,1)+" m²"],
ceil>0?["Ceilings",n(lc,1)+" L",n(ceil,1)+" m²"]:null,trim+door>0?["Trims and doors",n(lt,1)+" L",n(trim+door,1)+" m²"]:null,v.pm?["Primer needed",n(pr,1)+" L"]:null,["Suggested tins",t.join(" + ")||"0","topcoat, rounded up to whole litres"]]).concat(byItem(v.rooms,"Room",(it,nm,i)=>[nm,n(roomL[i],1)+" L","topcoat"])),
"Coverage depends on the product and the surface. Use the coverage printed on your paint tin, and keep the default of 12 m² per litre only as a general assumption."]}},

tile:{...META.tile,
f:[["@areas"],["op","Openings to deduct (doors, windows, showers)","m²",0],
["tw","Tile width","mm",300,null,1],["tl","Tile length","mm",600,null,1],["g","Grout gap","mm",3],
["pat","Laying pattern",[["Straight lay","straight",{x:10}],["Brick bond","brick",{x:10}],["Diagonal","diag",{x:15}],["Herringbone","herring",{x:30}]],0],
["x","Allowance for cuts and breakage","%",10],
["bm","Box information",[["Skip boxes","none"],["Tiles per box","tiles"],["Coverage per box (m²)","cover"]],0],
["bx","Tiles per box","no.",10,{bm:["tiles"]},1],["bc","Coverage per box","m²",1.44,{bm:["cover"]},1],
...costFields([["Do not estimate cost","none"],["Price per tile","tile"],["Price per m²","m2"],["Price per box","box"]]),["ag","Adhesive and grout estimate",[["No",0],["Yes",1]],0],
["tt","Tile thickness","mm",9,{ag:["1"]},1],["ac","Adhesive coverage per 20 kg bag","m²",4,{ag:["1"]},1]],
g:{areas:areaGroup(4,3,"Floor or wall areas")},
check:v=>totalArea(v)<v.op?["Openings to deduct are larger than the total area."]:[],
c:v=>{const A=totalArea(v)-v.op,ta=(v.tw+v.g)*(v.tl+v.g)/1e6,raw=A/ta,t=up(raw*(1+v.x/100));
let boxes=null,bn=0;if(v.bm==="tiles"){bn=up(t/v.bx);boxes=["Boxes",n(bn,0),n(v.bx,0)+" tiles per box"]}if(v.bm==="cover"){bn=up(t*(v.tw*v.tl/1e6)/v.bc);boxes=["Boxes",n(bn,0),n(v.bc,2)+" m² per box"]}
const gr=v.ag?A*((v.tl+v.tw)/(v.tl*v.tw))*v.g*v.tt*1.6:0;
return[compact([["Tiles to buy",n(t,0),"includes "+n(v.x,0)+"% allowance"],["Tiles before allowance",n(up(raw),0)],["Net area",n(A)+" m²"],["Tiles per m²",n(1/ta,1)],boxes,
v.ag?["Adhesive",n(up(A/v.ac),0)+" bags","20 kg bags, editable coverage"]:null,v.ag?["Grout",n(gr,1)+" kg","assumes 1.6 kg per litre, before waste"]:null,costRow(v,{tile:t,m2:A*(1+v.x/100),box:bn})]).concat(byItem(v.areas,"Area",(it,nm)=>[nm,n(up(areaOf(it)/ta*(1+v.x/100)),0)+" tiles",n(areaOf(it),1)+" m², before openings"])),
"Allowance depends on the layout and the installer. Buy all tiles from the same batch."]}},

brick:{...META.brick,
f:[["@walls"],
["pre","Brick or block type",[["Standard brick, 230 × 76 mm face","std",{bl:230,bh:76,bw:110}],["Double height brick, 230 × 162 mm face","dbl",{bl:230,bh:162,bw:110}],["Besser block, 390 × 190 mm face","bes",{bl:390,bh:190,bw:190}],["Custom size","custom"]],0],
["bl","Brick length","mm",230,null,1],["bh","Brick height","mm",76,null,1],["bw","Brick width","mm",110,null,1],
["j","Mortar joint thickness","mm",10],["skin","Wall construction",[["Single skin",1],["Double skin",2]],0],
["x","Extra for breakage and cuts","%",5],["pal","Bricks per pallet (0 to skip)","no.",0],["mo","Mortar estimate",[["No",0],["Yes",1]],0],...costFields([["Do not estimate cost","none"],["Price per brick","brick"],["Price per pallet","pallet"]])],
g:{walls:{title:"Walls",item:"Wall",add:"Add another wall",max:12,
fields:[NAME_F,["wl","Wall length","m",6,null,1],["wh","Wall height","m",2.4,null,1],["wo","Openings to deduct","m²",3]],defaults:[{}]}},
check:v=>v.walls.map((w,i)=>w.wl*w.wh<w.wo?"Wall "+(i+1)+": opening area exceeds the wall area. Check the wall dimensions and opening deduction.":null).filter(Boolean),
c:v=>{const net=sum(v.walls,w=>w.wl*w.wh-w.wo),per=1e6/((v.bl+v.j)*(v.bh+v.j)),base=net*per*v.skin,t=up(base*(1+v.x/100)),tall=Math.max(...v.walls.map(w=>w.wh)),
mortar=base*((v.bl+v.j)*(v.bh+v.j)*v.bw-v.bl*v.bh*v.bw)/1e9;
return[compact([["Bricks needed",n(t,0),"includes "+n(v.x,0)+"% extra"],["Net wall area",n(net)+" m²","after openings"],["Bricks before extra",n(up(base),0)],["Bricks per m²",n(per,1),"per skin, with a "+n(v.j,0)+" mm joint"],
["Courses high",n(up(tall*1000/(v.bh+v.j)),0),"tallest wall"],v.pal>0?["Pallets",n(up(t/v.pal),0),n(v.pal,0)+" bricks per pallet"]:null,v.mo?["Mortar",n(mortar,2)+" m³","joints only, add extra for waste"]:null,costRow(v,{brick:t,pallet:v.pal>0?up(t/v.pal):0})]).concat(byItem(v.walls,"Wall",(w,nm)=>[nm,n(up(Math.max(0,w.wl*w.wh-w.wo)*per*v.skin*(1+v.x/100)),0)+" bricks",n(Math.max(0,w.wl*w.wh-w.wo),1)+" m² net"])),
"Check the exact brick size and pallet quantity with your supplier. This calculator does not check wall strength or structural design."]}},

screed:{...META.screed,
f:[["@rooms"],["st","Screed type",[["Sand and cement screed","sc"],["Liquid screed","liq"],["Bagged ready mixed screed","bag"]],0],
["x","Extra for waste and level variations","%",10],
["ratio","Sand to cement mix",[["3 to 1",3],["4 to 1",4],["5 to 1",5]],1,{st:["sc"]}],
["cb","Cement bag size",[["20 kg",20],["25 kg",25]],0,{st:["sc"]}],
["by","Screed per bagged mix bag (check the bag)","litres",12,{st:["bag"]},1],...costFields([["Do not estimate cost","none"],["Price per m³","m3"],["Price per bag","bag"]])],
g:{rooms:{title:"Rooms or floors",item:"Room",add:"Add another room",max:12,
fields:[NAME_F,["rl","Length","m",5,null,1],["rw","Width","m",4,null,1],["rt","Thickness","mm",40,null,1]],defaults:[{}]}},
c:v=>{const A=sum(v.rooms,r=>r.rl*r.rw),base=sum(v.rooms,r=>r.rl*r.rw*r.rt/1000),m=base*(1+v.x/100),dry=m*1.3,cm=dry/(v.ratio+1);
let rows=[["Screed volume",n(m)+" m³","including waste allowance"],["Volume before waste",n(base,3)+" m³"],["Total floor area",n(A)+" m²"]];
if(v.st==="sc")rows.push(["Cement",n(up(cm*1440/v.cb),0)+" bags",n(v.cb,0)+" kg bags"],["Sand",n(dry*v.ratio/(v.ratio+1)*1.6)+" t","sharp sand"]);
if(v.st==="bag")rows.push(["Bags of ready mixed screed",n(up(m*1000/v.by),0),n(v.by,0)+" litres each"]);
const bagsN=v.st==="sc"?up(cm*1440/v.cb):v.st==="bag"?up(m*1000/v.by):0,cr=costRow(v,{m3:m,bag:bagsN});if(cr)rows.push(cr);return[rows.concat(byItem(v.rooms,"Room",(r,nm)=>[nm,n(r.rl*r.rw*r.rt/1000*(1+v.x/100))+" m³",n(r.rl*r.rw,1)+" m²"])),v.st==="liq"?"Liquid screed is estimated by volume only. Confirm the specified product yield, minimum order, thickness and delivery with your supplier.":v.st==="bag"?"Bag count uses the entered litres of finished screed yield per bag. Check the manufacturer’s bag yield and edit the field before ordering.":"For sand-and-cement screed, dry material volume is estimated at 30% above finished screed volume, then split using the selected mix ratio. Check your project specification and supplier yields."]}},

lineal:{...META.lineal,
f:[["dir","Conversion",[["Square metres to lineal metres","m2"],["Lineal metres to square metres","lm"],["Cubic metres to lineal metres (timber)","m3"]],0],
["@areas"],["lm","Length of material","m",20,{dir:["lm"]},1],["vol","Volume of timber","m³",1,{dir:["m3"]},1],["th","Thickness","mm",45,{dir:["m3"]},1],
["mat","Material",[["Custom width","custom"],["Flooring board, 130 mm","f130",{w:130,wu:1}],["Decking board, 140 mm","d140",{w:140,wu:1}],["Decking board, 90 mm","d90",{w:90,wu:1}],["Carpet roll, 3.66 m wide","c366",{w:3660,wu:1}],["Carpet roll, 4 m wide","c4",{w:4000,wu:1}],["Carpet roll, 5 m wide","c5",{w:5000,wu:1}]],0],
["wu","Width unit",[["Millimetres (mm)",1],["Centimetres (cm)",10],["Metres (m)",1000]],0],["w","Cover width","",130,null,1],
["x","Extra for waste","%",10,{dir:["m2"]}],["lp","Price per lineal metre (optional)","$",0]],
g:{areas:{...areaGroup(5,4,"Areas to cover"),when:{dir:["m2"]}}},
c:v=>{const wmm=v.w*v.wu,w=wmm/1000;let rows,note="Lineal metres are the total length of material laid end to end.";
if(v.dir==="m2"){const A=totalArea(v),raw=A/w,t=raw*(1+v.x/100);rows=[["Lineal metres",n(t,1)+" m","including waste"],["Without extra",n(raw,1)+" m"],["Total area",n(A)+" m²"],["Cover width used",n(wmm,0)+" mm"],["Formula",n(A)+" m² ÷ "+n(w,3)+" m"]];if(v.lp>0)rows.push(["Estimated cost",money(t*v.lp)]);rows=rows.concat(byItem(v.areas,"Area",(it,nm)=>[nm,n(areaOf(it)/w*(1+v.x/100),1)+" m",n(areaOf(it),1)+" m²"]))}
else if(v.dir==="lm"){const area=v.lm*w;rows=[["Area covered",n(area,2)+" m²"],["Length of material",n(v.lm,1)+" m"],["Cover width used",n(wmm,0)+" mm"],["Formula",n(v.lm)+" m × "+n(w,3)+" m"]];if(v.lp>0)rows.push(["Estimated cost",money(v.lm*v.lp)])}
else{const t=v.vol/(w*v.th/1000);rows=[["Lineal metres",n(t,1)+" m"],["Cover width used",n(wmm,0)+" mm"],["Thickness used",n(v.th,0)+" mm"],["Formula",n(v.vol)+" m³ ÷ ("+n(w,3)+" m × "+n(v.th/1000,3)+" m)"]];if(v.lp>0)rows.push(["Estimated cost",money(t*v.lp)]);note="Timber volume conversion needs both the width and the thickness of the board."}
return[rows,note+" Roll and board widths are common sizes, so confirm the cover width with your supplier."]}}
};
const LEGACY={
sqm:{nm:"Square metre",h:"Square Metre Calculator",t:"Square Metre Calculator | How to Work Out m2 and Square Metres",
md:"Free square metre calculator. Work out the area of rectangular, triangular and circular spaces, including a second rectangle for L shaped rooms.",
ld:"Calculate rectangular rooms, L shaped spaces, triangles and circles in square metres.",
f:[["shape","Shape",[["Rectangle","rectangle"],["Triangle","triangle"],["Circle","circle"]],0],["l","Section 1 length","m",5,["rectangle"]],["w","Section 1 width","m",4,["rectangle"]],["l2","Section 2 length (optional)","m",0,["rectangle"]],["w2","Section 2 width (optional)","m",0,["rectangle"]],["b","Triangle base","m",5,["triangle"]],["h","Perpendicular height","m",4,["triangle"]],["r","Circle radius","m",2,["circle"]]],
c:v=>{const a=v.shape==="triangle"?v.b*v.h/2:v.shape==="circle"?Math.PI*v.r*v.r:R(v);const label=v.shape==="triangle"?"Triangle":v.shape==="circle"?"Circle":"Rectangle area";return[[["Total area",n(a)+" m²"],["Shape",label],["Square feet",n(a*10.764,1)+" ft²"]],v.shape==="rectangle"?"For an L shaped room, add the second rectangle. Measure both rectangles without overlapping the same floor area.":v.shape==="triangle"?"Triangle area is base multiplied by perpendicular height, divided by two.":"Circle area uses pi multiplied by the radius squared."]},
a:[["What this square metre calculator does","This calculator finds the area of rectangular, triangular and circular spaces in square metres (m²). For an L shaped room, choose rectangle and add a second rectangular section. Use the result for flooring, paint, tiles, turf and other materials."],["How to work out square metres","For a rectangle, multiply length by width. For a triangle, multiply the base by the perpendicular height and divide by two. For a circle, multiply pi by the radius squared."],["Other shapes",[["Shape","Area"],["Rectangle","length × width"],["Triangle","base × perpendicular height ÷ 2"],["Circle","π × radius²"]]],["Square metre conversions",[["From","To"],["1 m²","10.76 square feet"],["1 m²","10,000 cm²"],["1 square foot","0.093 m²"],["1 hectare","10,000 m²"]]],["Tips","Measure in metres, not centimetres, to avoid mistakes. For an L shaped area, split the space into rectangles that do not overlap and add them together."]],how:["Choose rectangle, triangle or circle.","Enter the measurements shown for that shape. Circle measurements use radius, from the centre to the edge.","For an L shaped room, enter both dimensions for the optional second rectangle.","Read the total area in square metres or square feet."],
q:[["How do you work out square metres?","For a rectangle, multiply length by width. For a triangle, multiply base by perpendicular height and divide by two. For a circle, use pi times radius squared."],["How do I calculate an L shaped room?","Split the room into two rectangles, measure each one and add the areas. Make sure the two rectangles do not overlap."],["How many square feet in a square metre?","One square metre is about 10.76 square feet."]] },
cubic:{nm:"Cubic metre",h:"Cubic Metre Calculator (m³)",t:"Cubic Metre Calculator | m3 Volume Calculator Australia",
md:"Free cubic metre calculator. Work out rectangular or cylindrical volume in m3 and litres using metric measurements.",
ld:"Work out the volume of a rectangular space or cylinder in cubic metres and litres.",
f:[["shape","Shape",[["Rectangular space","rectangle"],["Cylinder or round hole","cylinder"]],0],["l","Length","m",4,["rectangle"]],["w","Width","m",3,["rectangle"]],["dia","Diameter","m",1,["cylinder"]],["h","Height or depth","m",.5]],
c:v=>{const cylinder=v.shape==="cylinder",area=cylinder?Math.PI*Math.pow(v.dia/2,2):v.l*v.w,m=area*v.h;return[[["Volume",n(m,3)+" m³"],["Litres",n(m*1000,0)+" L"],[cylinder?"Cross-section area":"Floor area",n(area)+" m²"]],cylinder?"Cylinder volume uses pi × radius × radius × height. The entered diameter is halved to get the radius.":"Rectangular volume is length × width × height. One cubic metre is 1,000 litres."]},
a:[["What this cubic metre calculator does","This calculator works out volume in cubic metres (m³) and litres for rectangular spaces and cylinders. Use it for trenches, pits, planters, fill, tanks or post holes."],["How to calculate cubic metres","For a rectangular space, multiply length by width by height, all in metres. For a cylinder, multiply pi by the radius squared and the height. The radius is half the diameter."],["Volume conversions",[["From","To"],["1 m³","1,000 litres"],["1 litre","0.001 m³"],["1 m³","35.3 cubic feet"],["1 cubic foot","0.028 m³"]]],["How to convert litres to m³","Divide litres by 1,000. A 500 litre tank is 0.5 m³. For a round tank or post hole, choose cylinder and enter its diameter and height."]],how:["Choose a rectangular space or a cylinder.","Enter the length and width for a rectangle, or the diameter for a cylinder.","Enter the height or depth in metres. Convert millimetres to metres by dividing by 1,000.","Read the volume in cubic metres and litres."],
q:[["How do you calculate cubic metres?","For a rectangular space, multiply length by width by height. For a cylinder, multiply pi by the radius squared and the height."],["How many litres in a cubic metre?","There are 1,000 litres in 1 cubic metre."],["How do I convert millimetres to metres?","Divide by 1,000. For example, 150 mm is 0.15 m."]] }
};
const ORDER=['concrete','gravel','soil','mulch','paint','tile','brick','screed','sqm','cubic','lineal'];
const C={};ORDER.forEach(function(k){C[k]=NEW_CALCS[k]||LEGACY[k];});

/* Default input values, used by tests and by the reset button logic */
const defaultValues=(c)=>{const v={};c.f.forEach(f=>{if(String(f[0])[0]==='@')return;v[f[0]]=Array.isArray(f[2])?(isNaN(Number(f[2][f[3]][1]))?f[2][f[3]][1]:Number(f[2][f[3]][1])):f[3]});
Object.keys(c.g||{}).forEach(name=>{const g=c.g[name];v[name]=(g.defaults||[{}]).map(d=>{const it={};g.fields.forEach(f=>{const dv=d[f[0]];it[f[0]]=Array.isArray(f[2])?(dv!==undefined?dv:(isNaN(Number(f[2][f[3]][1]))?f[2][f[3]][1]:Number(f[2][f[3]][1]))):(dv!==undefined?dv:f[3])});return it})});return v};
