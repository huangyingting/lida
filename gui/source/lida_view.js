/*******************************************************************************
* IMPORT STATEMENTS
*******************************************************************************/




/*******************************************************************************
* MAIN VIEW
*******************************************************************************/

var mainApp = new Vue({
  el: '#main-app',

  data() {
    return {
      status: 'logging',
      displayingDialogue: '',
      alreadyVisited: [],
      splittingFile: '',
      splittingTextSourceFile: '',
    }
  },

  created () {
      // Annotation APP EVENTS
      annotationAppEventBus.$on("go_back", this.clear_annotation );
      annotationAppEventBus.$on("dialogue_id_change", this.change_dialogue_name );

      // Split View EVENTS
      textSplitterEventBus.$on("cancel", this.clear_text_split)
      textSplitterEventBus.$on("splitting_complete", this.clear_text_split)

      // All Dialogue (MAIN VIEW) Event Bus
      allDialoguesEventBus.$on( "dialogue_selected", this.load_in_dialogue_to_annotate )
      allDialoguesEventBus.$on( "dialogue_deleted", this.remove_dialogue_from_visited_list )
      allDialoguesEventBus.$on( "loaded_text_file", this.handle_loaded_text_file )
      allDialoguesEventBus.$on( "update_username", this.update_username )

      //Database View Event Bus
      databaseEventBus.$on( "database_selected", this.load_database_view )

      //Check if already logged
      this.check_login_cookie()

  },

  methods: {

    update_username: function(event) {
      console.log("received")
        let nuovoNome = event;
        backend.put_name("USER_"+nuovoNome+".json")
        .then( (response) => {
          if (response) {
            console.log("Name Changed");
          } else {
            alert('Server error, name not changed.');
          }
            this.setCookie(nuovoNome);
            this.status = "list-all"
        })
    },    

    setCookie: function(nuovoNome) {
      console.log("Log in name set in cookies");
      localStorage.setItem("remember", nuovoNome);
    },

    check_login_cookie: function() {
        if (localStorage["remember"] != undefined) {
          this.update_username(localStorage["remember"])
        } else {
          return
        }
    },

    load_in_dialogue_to_annotate: function (event) {
        this.displayingDialogue = event;
        this.status = 'annotating';
        if (!this.alreadyVisited.includes(event)) {
            this.alreadyVisited.push(event)
        }
    },

    clear_annotation: function (event) {
        this.displayingDialogue = '';
        this.status = 'list-all';
    },

    clear_text_split: function (event) {

        this.splittingTextSourceFile = '';
        this.splittingText = '';
        this.status = 'list-all'

    },

    remove_dialogue_from_visited_list(id) {
        for (idx in this.alreadyVisited) {
            if (this.alreadyVisited[idx] == id) {

                this.alreadyVisited.splice(idx, 1)
                break

            }
        }
    },

    change_dialogue_name: function (event) {
        console.log('---- CHANGING DIALOGUE NAME ----');
        console.log(event);
        backend.change_dialogue_name_async(this.displayingDialogue, event.target.value)
            .then( (response) => {

                if (response) {
                    this.displayingDialogue = event.target.value;
                } else {
                    alert('Server error, name not changed.')
                }

            })
    },

    handle_loaded_text_file: function (event) {
        console.log('---- HANDLING LOADED TEXT FILE ----');
        console.log(event);
        this.status = 'splitting-text-file';
        this.splittingFile = event;
        this.splittingTextSourceFile = event.name;
    },

    load_database_view: function (event) {
        console.log('---- DATABASE VIEW ----');
        console.log(event);
        console.log(databaseEventBus);
        this.status = 'database-view';
    },

  },

  template:
  `

    <login-view v-if="status === 'logging'">
    </login-view>

    <annotation-app v-else-if="status === 'annotating'"
                    v-bind:dialogueId="displayingDialogue">
    </annotation-app>

    <text-splitter v-else-if="status === 'splitting-text-file'"
                   v-bind:file="splittingFile"
                   v-bind:sourceFname="splittingTextSourceFile">
    </text-splitter>

    <database-view v-else-if="status === 'database-view'">
    </database-view>

    <all-dialogues v-else
                   v-bind:alreadyVisited="alreadyVisited">
    </all-dialogues>
  `


})
