import React from "react";
import { EvidenceChart, RichNarrative, useDataApp } from "../../data-app-public.jsx";
import "./report.css";

export function ReportContent(){
  const {reviewedRows}=useDataApp();
  const expectations=reviewedRows("expectations");
  const buyers=reviewedRows("buyers");
  const inventory=reviewedRows("inventory");
  const consultation=reviewedRows("consultation");
  return <article className="report-page css-chart-export">
    <RichNarrative id="chart-export-intro" value="# CSS: ключевые показатели рынка\n\nДиаграммы для русского обзора. Проверка источников: 16 сентября 2026."/>
    <EvidenceChart id="css-expectations-overview" queryId="expectations" title="Руководители чаще ждут ухудшения, чем улучшения"
      description="Ожидания на 2025 и 2026, BoF–McKinsey. Это опросы, не итоги года; показаны 2 ответа."
      rows={expectations.map(r=>({...r,"2025 (%)":r.previousPercent,"2026 (%)":r.currentPercent}))} sourceRows={expectations} height={270}
      spec={{type:"horizontalBar",x:"answer",y:"2026 (%)",fields:["2025 (%)","2026 (%)"],stackable:false,showValues:true,valueDecimals:0,colors:{"2025 (%)":"#8d94a7","2026 (%)":"#262c9e"}}}/>
    <EvidenceChart id="css-buyers-overview" queryId="buyers" title="Покупатели ищут выгоду и планируют тратить меньше"
      description="Данные, приведённые McKinsey в феврале 2026. Ответы могут пересекаться; не складывать доли."
      rows={buyers.map(r=>({...r,shortAnswer:r.buyerPercent===80?"Ищут выгоду":"План экономии","Доля (%)":r.buyerPercent}))} sourceRows={buyers} height={240}
      spec={{type:"horizontalBar",x:"shortAnswer",y:"Доля (%)",stackable:false,showValues:true,valueDecimals:0,colors:{"Доля (%)":"#262c9e"}}}/>
    <EvidenceChart id="css-inventory-overview" queryId="inventory" title="Запасы дольше остаются непроданными: +14%"
      description="Индекс дней хранения: среднее до 2020 = 100. Уровень 2024 = 114. Исторические данные в обзоре 2026."
      rows={inventory.map(r=>({...r,shortPeriod:r.inventoryIndex===100?"До 2020":"2024"}))} sourceRows={inventory} height={240}
      spec={{type:"horizontalBar",x:"shortPeriod",y:"inventoryIndex",stackable:false,showValues:true,valueDecimals:0,colors:{inventoryIndex:"#262c9e"}}}/>
    <EvidenceChart id="css-consultation-overview" queryId="consultation" title="Великобритания: цены часовой консультации"
      description="£50 + НДС и £125/час. Среднее базовых тарифов: £87,50, N=2. Не средний оплаченный чек рынка."
      rows={consultation} sourceRows={consultation} height={240}
      spec={{type:"horizontalBar",x:"provider",y:"baseGBP",currency:"GBP",stackable:false,showValues:true,valueDecimals:0,colors:{baseGBP:"#262c9e"}}}/>
  </article>;
}
