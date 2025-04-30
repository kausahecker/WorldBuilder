document.addEventListener("DOMContentLoaded",()=>{
    var categorySelect=document.getElementById("category");
    var searchInput=document.getElementById("searchInput");
    var entriesDiv=document.getElementById("entries");
    function renderEntries(data)
    {
      entriesDiv.innerHTML="";
      data.forEach(item=>{
        var card=document.createElement("div");
        var imageHTML=item.image?"<img src='"+item.image+"' alt='"+item.name+"' />":"";
        card.innerHTML="<h3>"+item.name+"</h3>"+imageHTML+ "<pre>"+JSON.stringify(item,null,2)+"</pre>";
        entriesDiv.appendChild(card);
      });
    }

    async function fetchCategory(cat)
    {
        const res=await fetch("/api/fetch/"+cat);
        const data=await res.json();
        renderEntries(data);
        searchInput.oninput=()=>{
            const q=searchInput.value.toLowerCase();
            const filtered=data.filter(d=>{
                return JSON.stringify(d).toLowerCase().includes(q)
            });
            renderEntries(filtered);
        };
    }
  
    categorySelect.onchange=()=>{
        fetchCategory(categorySelect.value);
    };

    fetchCategory(categorySelect.value);

    document.getElementById("submitBtn").onclick=async ()=>{
        var query=document.getElementById("queryInput").value;
        var type=document.getElementById("typeInput").value;
        if(!query)
        {
            return alert("Enter a topic to research");
        }
        await fetch("/api/research/"+encodeURIComponent(query)+"/"+type);
        alert("Data submitted. Refresh the page in a moment.");
    };
});