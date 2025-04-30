const express=require("express");
const cors=require("cors");
const bodyParser=require("body-parser");
const path=require("path");
const {google}=require("googleapis");
const fs=require("fs");
const fetch=require("node-fetch");

const api_key="AIzaSyCRNyElFthqkpPifCWuoXa-jj6oZcg2CSM";
const cx="f13e53916a91d47fb";

const auth=new google.auth.GoogleAuth({
    "keyFile":"World Builder/world-builder-458313-83350028d794.json",
    "scopes":["https://www.googleapis.com/auth/spreadsheets"]
});

const app=express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname+"/public"));

async function post(content,type)
{
    var response=await fetch("https://hook.eu2.make.com/5om3nv7g51k6liijiovijb5533d2qhj9",{
        "method":"POST",
        "headers":{"Content-Type":"application/json"},
        "body":JSON.stringify({
            "type":type,
            "content":content
        })
    });
    var text=await response.text();
    return JSON.parse(text.replace("```json","").replace("```",""));
}

async function searchImage(query)
{
    const url="https://www.googleapis.com/customsearch/v1?q="+encodeURIComponent(query)+"&searchType=image&key="+api_key+"&cx="+cx+"&num=1";
    const res=await fetch(url);
    const data=await res.json();
    if (data.items&&data.items.length>0)
    {
        return data.items[0].link;
    }
    else
    {
        throw new Error('No image found');
    }
}

async function appendToSheet(sheet,data)
{
    var client=await auth.getClient();
    var sheets=google.sheets({
        "version":"v4",
        "auth":client
    });
    try
    {
        var result=await sheets.spreadsheets.values.append({
            "spreadsheetId":"1ifxNZUigEHSHTJbdqtRg7kw-HI9032dwYaiPM7qrhhM",
            "range":sheet,
            "valueInputOption":"RAW",
            "resource":data,
        });
        return result.data.updates.updatedCells+" cells appended.";
    }
    catch(err)
    {
        console.error("The API returned an error: "+err);
    }
}

async function request(query,type)
{
    var res=await post(query,type);
    for(var type of ["characters","places","items","abilities","vehicles","species"])
    {

        var rows=[]
        for(var item of res[type])
        {
            var values=Object.values(item);
            try
            {
                const imageUrl=await searchImage(item["name"]);
                values.push(imageUrl);
            }
            catch(err)
            {
                console.warn("No image found for",item["name"]);
            }
            rows.push(values);
        }
        await appendToSheet(type,{"values":rows});
    }
}

async function readCategory(cat)
{
    var client=await auth.getClient();
    var sheets=google.sheets({
        "version":"v4",
        "auth":client
    });
    var response=await sheets.spreadsheets.values.get({
      "spreadsheetId":"1ifxNZUigEHSHTJbdqtRg7kw-HI9032dwYaiPM7qrhhM",
      "range":cat
    });
    var rows=response.data.values;
    if(!rows||rows.length===0)
    {
        return [];
    }
    return rows.slice(1).map((row)=>{
        var item={};
        var headers=rows[0];
        headers.forEach((header,i)=>{
            item[header]=row[i]||"";
        });
        return item;
    });
}

app.get("/api/research/:query/:type",(req,res)=>{
    try
    {
        request(req.params.query,req.params.type);
    }
    catch(err)
    {
        console.log(err);
        res.send(err);
    }
});

app.get("/api/fetch/:cat",(req,res)=>{
    try
    {
        readCategory(req.params.cat).then((data)=>
        {
            res.send(data);
        });
    }
    catch(err)
    {
        console.log(err);
        res.send(err);
    }
})

app.listen(3000,()=>{
    console.log("Server started on port 3000");
});