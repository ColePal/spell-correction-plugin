let languagesChart;
        function initCharts() {
         const languages_chart = document.getElementById("languages_chart").getContext("2d");
         languagesChart = new Chart(languages_chart, {type: "doughnut", data: {labels: [], datasets: [{ data: [], borderWidth: 0,hoverOffset: 6,backgroundColor: []}]}, options: {responsive: true, plugins: { legend: { position: "bottom" } }, cutout: "60%"}}
         );}

        function randomColour() {
         const red = Math.floor(Math.random() * 255);
          const green = Math.floor(Math.random() * 255);
         const blue = Math.floor(Math.random() * 255);
         return `rgb(${red}, ${green}, ${blue})`;
}

        function toggleMenu() {
            var x = document.getElementById("customMenu");
              if (x.style.display === "none") {
                x.style.display = "block";
              } else {
                x.style.display = "none";
              }
        }

        async function all_languages(){
         //const response = await fetch("{% url 'dashboard_languages' %}");
         const response = await fetch(window.dashboard_languages);
          const data = await response.json();

           let languages = [];
           if (Array.isArray(data.languages_all)) {
               languages = data.languages_all;
           }
           const labels = languages.map(e => e.language);
           const colour = labels.map(() => randomColour());
           const percents = languages.map(e => e.percentage);
           languagesChart.data.labels = labels;
           languagesChart.data.datasets[0].data = percents;
           languagesChart.data.datasets[0].backgroundColor = colour;
           languagesChart.update();
        }


        async function misspelled() {
            //const response = await fetch("{% url 'misspelled_word' %}");
            const response = await fetch(window.misspelled_word);
            const data = await response.json();
            const wordList = document.getElementById("top_misspelled");
            const top = Array.isArray(data.top) ? data.top : [];
            if (top.length === 0) {
                wordList.innerHTML = `<li class="misspelled-words">No data yet</li>`;
                return;
            }
            wordList.innerHTML = top.map((a, b) => `<li class="d-flex justify-content-between">
             <span>${b + 1}. <strong>${a.word}</strong></span>
             <span class="misspelled-words">${a.count}</span></li>`) .join("");
        }

        //document.getElementById("total_corrections").textContent = data.total_corrections;#}
        //document.getElementById("unique_misspelled").textContent = data.unique_misspelled;#}
        //document.getElementById("unique_corrected").textContent  = data.unique_corrected;#}
        //document.getElementById("total_requests").textContent    = data.total_requests;#}



        let mistakeChart;


 async function percentage(days){
          //const query_url = new URL("{% url 'mistakes_percentage_timeseries' %}", window.location.origin);
          const query_url = new URL(window.mistakes_percentage_timeseries, window.location.origin);
          query_url.searchParams.set("days", days);
            const response = await fetch(query_url);
          if (!response.ok){
              return { labels: [], series: [] };
          }
          return response.json();
        }


        async function renderMistakePct() {
          const days = document.getElementById("pctRange").value;
          const payload = await percentage(days);
          const labels = Array.isArray(payload.labels) ? payload.labels : [];
          const series = Array.isArray(payload.series) ? payload.series : [];

          if (!mistakeChart) {
            const context = document.getElementById("mistake_pct_chart").getContext("2d");
            mistakeChart = new Chart(context, {
              type: "line",
              data: { labels, datasets: [] },
              options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y?.toFixed(2)}%` } }},
                scales: {y: { beginAtZero: true, ticks: { callback: v => `${v}%` }, title: { display: true, text: "Mistakes (%)" } }}
              }
            }
            );
          }
          let datasets;
          if (series) {
          datasets =series.map(series=>({
            label: series.label||series.username || (series.user_id ? `User ${series.user_id}` : "You"), data: Array.isArray(series.data) ? series.data : [],
            borderColor: randomColour(),
            fill: false,
            tension: 0.25,
            pointRadius: 1
          }));}
          else {
               datasets = { label: "No data", data: labels.map(() => 0) };
          }
          mistakeChart.data.labels = labels;
          mistakeChart.data.datasets = datasets
          mistakeChart.update();
        }



         async function richness(){
            //const response=await fetch("{% url 'richness' %}");
            const response=await fetch(window.richness_);
             const data = await response.json();
             let colour;
             if (data.richness<40){
                 colour = '#dc3545'
             }
             else if (data.richness<70){
             colour = '#ffc107'
              }
             else{
                 colour = '#28a745'
             }
            const vocab= document.getElementById("vocab");
             vocab.textContent = `${data.richness.toFixed(1) }/100`;
             vocab.style.backgroundColor = colour;
         }

         async function typeSpeed(){
            //const response=await fetch("{% url 'type_speed' %}");
            const response=await fetch(window.type_speed);
            const data = await response.json();
             document.getElementById("tspeed").innerText = data.speed+" wpm";

             }
    document.addEventListener("DOMContentLoaded", () => {
      const picker = document.getElementById("box-picker");

      const boxMap = {
  languageQueries: document.getElementById("language_distribution_box"),
  mistakesChart:   document.getElementById("mistakes_box"),
  vocabRichness:   document.getElementById("language_richness_box"),
  spellingDetails: document.getElementById("spellings_details_box"),
  typingSpeed:     document.getElementById("typing_speed_box"),
};


        const initialized = {languageQueries: false, mistakesChart: false, vocabRichness: false, spellingDetails: false, typingSpeed: false};
        //let preferences =null
        /*
        try {
              preferences=JSON.parse(localStorage.getItem("dashboard_boxes"));
         }
        catch (error){
            console.error(error);
         }

         if (Array.isArray(preferences)){
             picker.querySelectorAll('input[type="checkbox"]').forEach(checkBox => {
                 checkBox.checked = preferences.includes(checkBox.value)
                 ;});
         }
         else{
             const allOn=Object.keys(boxMap).filter(k => boxMap[k]);
             picker.querySelectorAll('input[type="checkbox"]').forEach(checkBox => {checkBox.checked = allOn.includes(checkBox.value);});
             localStorage.setItem("dashboard_boxes", JSON.stringify(allOn));
         }*/
        //const allOn = Object.keys(boxMap).filter(k => boxMap[k]);
        //picker.querySelectorAll('input[type="checkbox"]').forEach(checkBox => {
        //  checkBox.checked = allOn.includes(checkBox.value);
        //});

      apply();

      picker.addEventListener("change", () => {
        //const selection= Array.from(picker.querySelectorAll('input[type="checkbox"]:checked')).map(checkBox => checkBox.value);
        //localStorage.setItem("dashboard_boxes", JSON.stringify(selection));
         apply();
      });
      const percentage=document.getElementById("pctRange")
       percentage.addEventListener("change", () => {
    if (!document.getElementById("mistakes_box").classList.contains("d-none")) {
      renderMistakePct();
  }
      });

      function apply() {
        const selected = new Set(Array.from(picker.querySelectorAll('input[type="checkbox"]:checked')).map(checkBox => checkBox.value));
        for (const [key, box] of Object.entries(boxMap)) {
          if (!box) {
              continue;
          }
          const on = selected.has(key);
          box.classList.toggle('d-none', !on);

         if (on && !initialized[key]) {

            if (key === "languageQueries") {
              if (!window.languagesChart)
              {
                  initCharts();
              }
              all_languages();
            }
            if (key === "mistakesChart")
            {
              renderMistakePct();
            }
            if (key === "vocabRichness")
            {
              richness();
            }
            if (key === "spellingDetails")
            {
              misspelled();}
            if (key === "typingSpeed")
            {
              typeSpeed();
            }
            initialized[key] = true;
          }
        }
      }
});