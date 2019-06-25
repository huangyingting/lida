/************************************
* All Dialgoues View "aka MAIN LIDA VIEW"
*************************************/



Vue.component("all-dialogues", {

  props: [
      "alreadyVisited"
  ],

  data () {
      return {
          allDialogueMetadata: [],
          dragging: false,
          showModal: false,
          name : ''
      }
  },

  mounted () {
      this.init();
  },

  methods: {

        init : function(){

            // Step ONE: Get FILE NAME
            backend.get_name()
                .then( (response) => {

                    this.name = response;

                });

            this.getAllDialogueIdsFromServer();

        },
    handleDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        let elem = document.getElementById('listedDialoguesContainer');
        elem.style.transition = '0.3s'
        elem.style.backgroundColor = '#c2c6c4';
        event.dataTransfer.effectAllowed = 'copyMove';
        event.dataTransfer.dropEffect = 'copy';
        this.dragging = true;
    },

    handleDragOut(event) {
        event.preventDefault();
        let elem = document.getElementById('listedDialoguesContainer');
        elem.style.backgroundColor = 'inherit';
        this.dragging = false;
    },

    handleDrop(event) {
        event.preventDefault();
        let elem = document.getElementById('listedDialoguesContainer');
        elem.style.backgroundColor = 'inherit';
        this.dragging = false;
        let file     = event.dataTransfer.files[0]
        this.handle_file(file);
    },

    getAllDialogueIdsFromServer() {

      backend.get_all_dialogue_ids_async()
          .then( (response) => {

              this.allDialogueMetadata = response;

          });

    },

    dialogue_already_visited(id) {
        return this.alreadyVisited.includes(id)
    },

    clicked_dialogue(clickedDialogue) {
        allDialoguesEventBus.$emit("dialogue_selected", this.allDialogueMetadata[clickedDialogue].id)
    },

    create_new_dialogue(event) {

        backend.post_empty_dialogue()
            .then( (newDialogueId) => {

                this.allDialogueMetadata.push({id: newDialogueId, num_turns: 0});

            });
    },

    delete_dialogue(event) {

        if (confirm("Are you sure you want to permanently delete this dialogue? This cannot be undone!")) {

            console.log('-------- DELETING --------')
            console.log()
            idToDelete = event.target.parentNode.parentNode.id;
            nameToDelete = this.allDialogueMetadata[idToDelete].id
            backend.del_single_dialogue_async(nameToDelete)
                .then( () => {
                    this.getAllDialogueIdsFromServer();
                });

            allDialoguesEventBus.$emit('dialogue_deleted', nameToDelete);

        } else {

            return

        }

    },

    open_file(event){
        let file = event.target.files[0];
        this.handle_file(file);
    },

    handle_file(file) {
        let textType = /text.plain/;
        let jsonType = /application.json/;

        if (file.type.match(textType)) {

            allDialoguesEventBus.$emit('loaded_text_file', file);

        } else if (file.type.match(jsonType)) {

            console.log('---- HANDLING LOADED JSON FILE ----');
            let reader = new FileReader();
            reader.onload = (event) => {
                console.log('THE READER VALUE', reader)
                console.log('THE EVENT VALUE', event)
                text = reader.result
                backend.post_new_dialogue_from_json_string_async(text)
                    .then( (response) => {

                        if ('error' in response.data) {
                            alert(`JSON file \"${file.name}\" is not in the correct format. Error from the server: ${response.data.error}`)
                        } else {
                            this.getAllDialogueIdsFromServer();
                        }

                    });
            };

            reader.readAsText(file);

        } else {

            alert('Only .txt or .json files are supported.')

        }
    },

    download_all_dialogues_from_server(event) {
        backend.get_all_dialogues_async()
            .then( (response) => {
                let blob = new Blob([JSON.stringify(response, null, 4)], {type: 'application/json'});
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', 'dialogues.json')
                document.body.appendChild(link)
                link.click();
            });
    }

  },

  template:
  
  `
  <div class="all-dialogues-container"
       id="listedDialoguesContainer"
       v-on:dragover="handleDragOver($event)"
       v-on:dragleave="handleDragOut($event)"
       v-on:drop="handleDrop($event)">

    <modal v-if="showModal" @close="showModal = false"></modal>

    <div class="dialogue-list-title-container">
        <h2 v-if="!(dragging)" class="all-dialogues-list-title">
            {{ allDialogueMetadata.length }} Data Items, {{ alreadyVisited.length }} Visited, {{name}}
        </h2>

        <h2 v-else class="all-dialogues-list-title">
            Drop Files Anywhere to Upload!
        </h2>

        <div class="help-button-container">
            <button class="help-button" @click="download_all_dialogues_from_server()">Download All Data</button>
            <button class="help-button" @click="showModal = true">File Format Info</button>
        </div>
    </div>

    <ul class="dialogue-list">

      <li class="listed-dialogue"
          v-for="(dat, index) in allDialogueMetadata"
          v-bind:id="index">

          <div class="dialogue-list-single-item-container">

            <div class="del-dialogue-button" v-on:click="delete_dialogue($event)">
              Del
            </div>


            <div class="dialouge-info" v-on:click="clicked_dialogue(index)">
                <div class="dialogue-id">
                  {{dat.id}}
                </div>

                <div v-if="dialogue_already_visited(dat.id)"
                     class="visited-indicator">
                     Visited
                </div>

                <div class="dialogue-num-turns" >{{dat.num_turns}} Turns</div>
            </div>

          </div>

      </li>

    </ul>

    <div class="add-button-container">
      <button class="add-dialogue-button" v-on:click="create_new_dialogue()">Add a New Dialogue</button>
    </div>

    <div class="upload-file-container">

        <!-- <div id="fileInputLabelContainer">
            Upload a Raw Text File to Process Into a Dialogue:
        </div> -->

        <div id="fileInputContainer">

            <input type="file"
                   id="fileInput"
                   name="fileInput"
                   accept=".txt, .json"
                   v-on:change="open_file($event)">

            <label for="fileInput"
                   id="fileInputLabel">
                   Upload File or Drag and Drop
            </label>

        </div>

    </div>

  </div>
  `

});
