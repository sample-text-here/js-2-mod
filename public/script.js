/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */

// prints "hi" in the browser's dev tools console
console.log("hi");

var editor = ace.edit("editor");
const toLoad = location.pathname.split("/")[2];

editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");
editor.setShowPrintMargin(false);

const form = document.querySelector("form");
form.addEventListener("submit", e => {
  e.preventDefault();
});

document.querySelector("#make").addEventListener("click", e => {
  var mod = getMetaData();
  var zip = new JSZip();
  zip.file("mod.json", JSON.stringify(mod));
  zip.file("scripts/main.js", editor.getValue());
  zip.generateAsync({ type: "blob" }).then(function(content) {
    if (!("showSaveFilePicker" in window)) {
      saveAs(content, "mod.zip");
      return;
    }
    window
      .showSaveFilePicker({
        types: [
          {
            description: "Zip file",
            accept: {
              "application/zip": [".zip"]
            }
          }
        ],
        excludeAcceptAllOption: true
      })
      .then(async file => {
        const stream = await file.createWritable();
        await stream.write(content);
        await stream.close();
      })
      .catch(err => {
        alert(err);
      });
  });
});

document.querySelector("#save").addEventListener("click", e => {
  if (toLoad) return;
  var mod = getMetaData();
  mod.code = editor.getValue();
  var lastMod = localStorage.getItem("lastMod");
  if (lastMod) {
    if (new Date().getTime() - lastMod < 30 * 1000) {
      //dont want mod spam
      alert("Please wait 30 seconds before saving mods");
      return;
    }
  }
  fetch("/new", {
    method: "POST",
    body: JSON.stringify(mod),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        alert(res.message);
        return;
      }
      localStorage.setItem("lastMod", new Date().getTime());
      window.location.pathname = "/mod/" + res.data;
    });
});

function getMetaData() {
  var mod = {
    minGameVersion: 105,
    version: 1
  };
  mod.displayName =
    form["name"].value ||
    "untitled-" +
      Math.random()
        .toString(32)
        .slice(2);
  mod.name = (form["name"].value || "untitled").replace(/[^a-zA-Z\d]/g, "-");
  mod.author = form["author"].value || "anon";
  mod.description = form["description"].value || "does stuff with js";
  return mod;
}

if (toLoad) {
  fetch("/api/" + toLoad, {})
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        alert(res.message);
        return;
      }
      form["name"].value = res.name;
      form["author"].value = res.author;
      form["description"].value = res.description;
      editor.setValue(res.code);
      document.querySelector("#outputs input:last-child").value =
        "remix the mod";
    });
}
