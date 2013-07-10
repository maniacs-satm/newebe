View = require '../lib/view'
Renderer = require '../lib/renderer'

module.exports = class NoteView extends View
    className: 'note simple-row line ml1 mr1 pt1 pb1'

    events:
        'click': 'onClicked'
        'click .note-delete-button': 'onDeleteClicked'
        'mousedown .editable': 'editableClick'
        "keyup .note-title": "onNoteChanged"

    onClicked: ->
        $('.note').unselect()
        $('.note-buttons').hide()
        $('.content-note').hide()
        @$el.select()
        @buttons.show()
        @contentField.show()

    onDeleteClicked: ->
        @model.destroy
            success: => @remove()
            error: => alert 'server error occured'

    onNoteChanged: ->
        @model.save()

    editableClick: etch.editableInit

    template: -> require './templates/note'

    constructor: (@model) ->
        super()

    afterRender: ->
        @buttons = @$ '.note-buttons'
        @buttons.hide()
        @contentField = @$ '.content-note'
        @contentField.hide()

        @renderTitle()
        @renderNote()
        @bindFields()

    renderTitle: ->
        renderer = new Renderer()
        @model.set 'content', 'Empty note' if @model.get('content').length is 0
        @model.set 'displayDate', renderer.renderDate @model.get 'lastModified'

    renderNote: ->
        @converter = new Showdown.converter()
        if @model.get("content").length > 0
            @contentField.html @converter.makeHtml(@model.get('content'))
        else
            @contentField.html "new note content"

    bindFields: ->
        @model.bindField 'title', @$(".note-title")
        @contentField.keyup =>
            @model.set "content", toMarkdown(@contentField.html())
            @onNoteChanged()

        @model.bind 'save', =>
            @model.set "content", toMarkdown(@contentField.html())
            @model.save

    getRenderData: ->
        model: @model?.toJSON()

    emptyTitle: ->
        @$(".note-title").val ''

    focusTitle: ->
        @$(".note-title").focus()