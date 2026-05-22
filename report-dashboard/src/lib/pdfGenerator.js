import { calcKPIs, calcByCategory, calcByPriority, calcByAssignee } from './kpi'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload  = resolve
    s.onerror = () => reject(new Error(`Failed to load: ${src}`))
    document.head.appendChild(s)
  })
}

async function getJsPDF() {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')
  return window.jspdf.jsPDF
}

const ACCENT=[61,92,255],GREEN=[5,150,105],RED=[220,38,38],AMBER=[217,119,6]
const PURPLE=[124,58,237],GRAY=[107,114,128],LIGHT=[248,249,251],WHITE=[255,255,255]
const DARK=[17,24,39],BORDER=[226,228,235]
const PC={P1:[220,38,38],P2:[217,119,6],P3:[61,92,255],P4:[5,150,105]}
const SL={done:'Done',open:'Open',in_progress:'In Progress'}
function hex(a){return '#'+a.map(v=>v.toString(16).padStart(2,'0')).join('')}

function kpiBox(doc,x,y,w,h,label,value,color){
  doc.setFillColor(...LIGHT); doc.roundedRect(x,y,w,h,3,3,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(...color)
  doc.text(String(value??'—'),x+8,y+16)
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GRAY)
  doc.text(label,x+8,y+24)
}

export async function generatePDF({tasks,periodLabel,generatedBy='IT Report Dashboard'}){
  const JsPDF = await getJsPDF()
  const doc   = new JsPDF({orientation:'portrait',unit:'mm',format:'a4'})
  const MW=210,MH=297,M=14,CW=MW-M*2
  const kpis=calcKPIs(tasks),byCategory=calcByCategory(tasks),byPriority=calcByPriority(tasks),byAssignee=calcByAssignee(tasks)
  const now=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})

  // Cover
  doc.setFillColor(...ACCENT); doc.roundedRect(M,20,CW,55,4,4,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(24); doc.setTextColor(...WHITE); doc.text('IT Department',M+10,42)
  doc.setFont('helvetica','normal'); doc.setFontSize(16); doc.setTextColor(200,212,255); doc.text('Performance Report',M+10,54)
  doc.setFontSize(11); doc.setTextColor(160,180,255); doc.text(periodLabel,M+10,65)
  doc.setFontSize(9); doc.setTextColor(...GRAY)
  doc.text(`Generated: ${now}`,M,85); doc.text(`By: ${generatedBy}`,M,91); doc.text(`Total tickets: ${tasks.length}`,M,97)
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.line(M,103,MW-M,103)

  // KPIs
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...DARK); doc.text('Executive Summary',M,113)
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.8); doc.line(M,115,MW-M,115)
  const BW=(CW-9)/4,BH=30
  const row1=[
    {label:'Total Tickets',value:kpis.total,color:ACCENT},
    {label:'Completed',value:kpis.completed,color:GREEN},
    {label:'Completion Rate',value:`${kpis.completionRate}%`,color:ACCENT},
    {label:'Open Incidents',value:kpis.open+kpis.inProg,color:kpis.open>10?RED:AMBER},
  ]
  const row2=[
    {label:'Avg Resolution',value:kpis.avgResTime?`${kpis.avgResTime}h`:'—',color:PURPLE},
    {label:'SLA Compliance',value:`${kpis.slaRate}%`,color:kpis.slaRate>=95?GREEN:RED},
    {label:'P1 Incidents',value:kpis.p1Count,color:kpis.p1Count>5?RED:GRAY},
    {label:'Total Analysed',value:tasks.length,color:DARK},
  ]
  row1.forEach((k,i)=>kpiBox(doc,M+i*(BW+3),120,BW,BH,k.label,k.value,k.color))
  row2.forEach((k,i)=>kpiBox(doc,M+i*(BW+3),155,BW,BH,k.label,k.value,k.color))

  // Page 2 - Category + Priority
  doc.addPage()
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...DARK); doc.text('Category Breakdown',M,20)
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.8); doc.line(M,22,MW-M,22)
  if(byCategory.length){
    doc.autoTable({startY:26,margin:{left:M,right:M},
      head:[['Category','Total','Done','Open','Avg Time','SLA %']],
      body:byCategory.map(c=>[c.name,c.total,c.done,c.open+c.inProg,c.avgTime!=null?`${c.avgTime}h`:'—',`${c.slaRate}%`]),
      headStyles:{fillColor:LIGHT,textColor:GRAY,fontStyle:'bold',fontSize:8},
      bodyStyles:{fontSize:9,textColor:DARK},alternateRowStyles:{fillColor:[250,250,250]},
      columnStyles:{0:{fontStyle:'bold'},1:{halign:'center'},2:{halign:'center',textColor:hex(GREEN)},3:{halign:'center'},4:{halign:'center'},5:{halign:'center'}},
      didParseCell(d){
        if(d.section==='body'&&d.column.index===5){d.cell.styles.textColor=parseInt(d.cell.raw)>=95?hex(GREEN):hex(RED);d.cell.styles.fontStyle='bold'}
        if(d.section==='body'&&d.column.index===3&&parseInt(d.cell.raw)>0)d.cell.styles.textColor=hex(AMBER)
      }
    })
  }
  const afterCat=doc.lastAutoTable?doc.lastAutoTable.finalY+12:80
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...DARK); doc.text('Priority Breakdown',M,afterCat)
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.8); doc.line(M,afterCat+2,MW-M,afterCat+2)
  const PBW=(CW-9)/4
  byPriority.forEach((p,i)=>{
    const bx=M+i*(PBW+3),by=afterCat+6,color=PC[p.priority]||DARK
    doc.setFillColor(...LIGHT); doc.roundedRect(bx,by,PBW,30,3,3,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...color); doc.text(p.priority,bx+6,by+12)
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(p.label||p.priority,bx+6,by+19)
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...color); doc.text(String(p.count),bx+6,by+27)
  })

  // Page 3 - Assignees
  if(byAssignee.length){
    doc.addPage()
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...DARK); doc.text('Assignee Performance',M,20)
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.8); doc.line(M,22,MW-M,22)
    doc.autoTable({startY:26,margin:{left:M,right:M},
      head:[['Technician','Assigned','Done','Completion','Avg Time','SLA %','P1s']],
      body:byAssignee.map(a=>[a.name,a.tasks,a.done,`${a.completionRate}%`,a.avgTime!=null?`${a.avgTime}h`:'—',`${a.slaRate}%`,a.p1]),
      headStyles:{fillColor:LIGHT,textColor:GRAY,fontStyle:'bold',fontSize:8},
      bodyStyles:{fontSize:9,textColor:DARK},alternateRowStyles:{fillColor:[250,250,250]},
      columnStyles:{0:{fontStyle:'bold'},1:{halign:'center'},2:{halign:'center'},3:{halign:'center'},4:{halign:'center'},5:{halign:'center'},6:{halign:'center'}},
      didParseCell(d){
        if(d.section==='body'&&d.column.index===5){const v=parseInt(d.cell.raw);d.cell.styles.textColor=v>=95?hex(GREEN):v>=85?hex(AMBER):hex(RED);d.cell.styles.fontStyle='bold'}
        if(d.section==='body'&&d.column.index===6&&parseInt(d.cell.raw)>0)d.cell.styles.textColor=hex(RED)
      }
    })
  }

  // Final page - Ticket log
  doc.addPage()
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...DARK); doc.text('Full Ticket Log',M,20)
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(`${tasks.length} tickets · ${periodLabel}`,M,26)
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.8); doc.line(M,28,MW-M,28)
  doc.autoTable({startY:32,margin:{left:M,right:M},
    head:[['Ticket ID','Title','Category','Pri','Assignee','Status','Time','SLA']],
    body:tasks.map(t=>[t.ticket_id||'—',t.title||'—',t.category||'—',t.priority||'—',t.assignee_name||'—',SL[t.status]||t.status||'—',t.resolution_time_hrs!=null?`${t.resolution_time_hrs}h`:'—',t.sla_met===true?'Yes':t.sla_met===false?'No':'—']),
    headStyles:{fillColor:LIGHT,textColor:GRAY,fontStyle:'bold',fontSize:7},
    bodyStyles:{fontSize:7.5,textColor:DARK},alternateRowStyles:{fillColor:[250,250,250]},
    columnStyles:{0:{cellWidth:18},1:{cellWidth:'auto'},2:{cellWidth:22},3:{cellWidth:10,halign:'center',fontStyle:'bold'},4:{cellWidth:26},5:{cellWidth:20},6:{cellWidth:12,halign:'center'},7:{cellWidth:10,halign:'center',fontStyle:'bold'}},
    didParseCell(d){
      if(d.section==='body'){
        if(d.column.index===3&&PC[d.cell.raw])d.cell.styles.textColor=hex(PC[d.cell.raw])
        if(d.column.index===7){if(d.cell.raw==='Yes')d.cell.styles.textColor=hex(GREEN);if(d.cell.raw==='No')d.cell.styles.textColor=hex(RED)}
      }
    }
  })

  // Footer all pages
  const total=doc.getNumberOfPages()
  for(let i=1;i<=total;i++){
    doc.setPage(i); doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...GRAY)
    doc.text(`IT Department Report · ${periodLabel} · Page ${i} of ${total}`,M,MH-8)
    doc.text('CONFIDENTIAL',MW-M,MH-8,{align:'right'})
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(M,MH-11,MW-M,MH-11)
  }
  doc.save(`IT_Report_${periodLabel.replace(/ /g,'_')}.pdf`)
}
