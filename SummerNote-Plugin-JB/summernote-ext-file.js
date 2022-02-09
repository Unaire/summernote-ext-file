(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function ($) {

    $.extend(true, $.summernote.lang, {
        'en-US': {
            file: {
                toolNew: 'New document',
                toolOpen: 'Open',
                toolSave: 'Save',
                questionNew: 'Do you want a new document and erase this one?',
                questionOpen: 'Do you want open a document and replace this one?',
                labelsListOpen: [
                    'Text',
                    'Summernote',
                    'Word'
                ],
                labelsListSave: [
                    'Text',
                    'Summernote',
                    'Word',
                    'PDF'
                ]
            }
        }
    });
    $.extend($.summernote.options, {
        file: {
            listOpen: [
                'txt',
                'xml',
                        //'word'
            ],
            listSave: [
                'txt',
                'xml',
                'wrd',
                'pdf'
            ]
        }
    });

    /**
     * @param {Object} context - context object has status of editor.
     */
    $.extend($.summernote.plugins, {
        'file': function (context) {
            const { jsPDF } = window.jspdf;
            
            var self = this;
            var ui = $.summernote.ui;
            var $note = context.layoutInfo.note;
            var options = context.options;
            var $editor = context.layoutInfo.editor;
            var $editable = context.layoutInfo.editable;
            var $toolbar = context.layoutInfo.toolbar;
            var lang = context.options.langInfo;
            var divExportHTML = document.createElement('div');
            document.body.appendChild(divExportHTML);
            

            // Menu Open
            var listTypes = options.file.listOpen;
            var listLabels = lang.file.labelsListOpen;
            var menuOpen = '';
            for (var i = 0; i < listTypes.length; i++) {
                menuOpen += '<a class="dropdown-item" href="#" role="listitem" data-value="' + listTypes[i] + '" aria-label="' + listLabels[i] + '">' + listLabels[i] + '</a>';
            }
            // Menu Save
            var listTypes = options.file.listSave;
            var listLabels = lang.file.labelsListSave;
            var menuSave = '';
            for (var i = 0; i < listTypes.length; i++) {
                menuSave += '<a class="dropdown-item" href="#" role="listitem" data-value="' + listTypes[i] + '">' + listLabels[i] + '</a>';
            }


            // Add New button
            context.memo('button.fileNew', function () {
                // create button
                return ui.button({
                    className: 'btn-file-new',
                    contents: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
                    tooltip: lang.file.toolNew,
                    container: 'body',
                    click: self.fileNew
                }).render();
            });

            // Add Open button
            context.memo('button.fileOpen', function () {
                // create button
                return ui
                        .buttonGroup([
                            ui.button({
                                className: 'btn-file-open dropdown-toggle',
                                contents: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' + ui.icon(options.icons.caret, "span"),
                                tooltip: lang.file.toolOpen,
                                container: 'body',
                                data: {
                                    toggle: 'dropdown'
                                },
                                click: function (e) {
                                    if (!confirm(lang.file.questionNew)) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }
                            }),
                            ui.dropdown({
                                className: 'dropdown-file-open dropdown-style',
                                //items: options.file.listOpen,
                                contents: menuOpen,
                                click: function (e) {
                                    // Récupération du type de fichier choisi
                                    var $button = $(e.target);
                                    self.fileOpen($button.data('value'));
                                }
                            }),
                        ]).render();
            });

            // Add Save button
            context.memo('button.fileSave', function () {
                // create button
                return ui
                        .buttonGroup([
                            ui.button({
                                className: 'btn-file-save',
                                contents: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>' + ui.icon(options.icons.caret, "span"),
                                tooltip: lang.file.toolSave,
                                container: 'body',
                                data: {
                                    toggle: 'dropdown'
                                },
                                click: function () {
                                    // Cursor position must be saved because is lost when dropdown is opened.
                                    context.invoke('editor.saveRange');
                                }
                            }),
                            ui.dropdown({
                                className: "dropdown-file-save dropdown-style",
                                //checkClassName: options.icons.menuCheck,
                                contents: menuSave,
                                click: function (e) {
                                    // Récupération du type de fichier choisi
                                    var $button = $(e.target);
                                    self.fileSave($button.data('value'));
                                }
                            }),
                        ]).render();
            });

            // Fonction pour ouvrir un nouveau document
            this.fileNew = function () {
                if (confirm(lang.file.questionNew)) {
                    $note.summernote('reset');
                    $note.summernote('focus');
                }
                ;
            };

            // Fonction pour ouvrir un document existant
            this.fileOpen = function (type) {
                switch (type) {
                    case 'txt':
                        fnOpenFileDialog('.txt,text/plain', function () {
                            var reader = new FileReader();
                            reader.onload = function () {
                                $note.summernote('reset');
                                $note.summernote('code', nl2br(this.result));

                            };
                            reader.readAsText(this.files[0], 'ISO-8859-1');
                        });
                        break;
                    case 'xml':
                        fnOpenFileDialog('.smn', function () {
                            var reader = new FileReader();
                            reader.onload = function () {
                                $note.summernote('reset');
                                $note.summernote('code', this.result);

                            };
                            reader.readAsText(this.files[0], 'ISO-8859-1');
                        });
                        break;
                        break;
                    case 'word':
                        fnOpenFileDialog('.docx', function () {
                            var reader = new FileReader();
                            reader.onloadend = function () {
                                var zip = new PizZip(this.result);
                                var doc = new Docxtemplater().loadZip(zip);
                                doc.render({linebreaks: true});
                                $note.summernote('reset');
                                $note.summernote('code', nl2br(doc.getFullText()));
                            };
                            if (this.files[0].type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                                reader.readAsArrayBuffer(this.files[0]);
                            }
                        });
                        break;
                }
            };

            // Fonction pour enregister un document
            this.fileSave = function (type) {
                switch (type) {
                    case 'txt':
                        var sText = $note.summernote("code")
                                .replace(/<\/p>/gi, "\r\n")
                                //.replace(/<br\/?>/gi, "\r\n")
                                .replace(/<\/?[^>]+(>|$)/g, "");
                        var blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]),
                            sText], {
                            type: "text/plain;charset=utf-8"
                        });
                        saveAs(blob, 'document.txt');
                        break;
                    case 'xml':
                        var sText = $note.summernote("code");
                        var blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]),
                            sText], {
                            type: "text/plain;charset=utf-8"
                        });
                        saveAs(blob, 'document.smn');
                        break;
                    case 'wrd':
                        $(divExportHTML).html($note.summernote("code"));
                        $(divExportHTML).wordExport('document');
                        break;
                    case 'pdf':
                        $(divExportHTML).html($note.summernote("code"));
                        var HTML_Width = $(divExportHTML).width();
                        var HTML_Height = $(divExportHTML).height();
                        var top_left_margin = 15;
                        var PDF_Width = HTML_Width + (top_left_margin * 2);
                        var PDF_Height = (PDF_Width * 1.5) + (top_left_margin * 2);
                        var canvas_image_width = HTML_Width;
                        var canvas_image_height = HTML_Height;
                        var totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;
                        html2canvas($(divExportHTML)[0]).then(function (canvas) {
                            var imgData = canvas.toDataURL("image/jpeg", 1.0);
                            var pdf = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);
                            pdf.addImage(imgData, 'JPG', top_left_margin, top_left_margin, canvas_image_width, canvas_image_height);
                            for (var i = 1; i <= totalPDFPages; i++) {
                                pdf.addPage(PDF_Width, PDF_Height);
                                pdf.addImage(imgData, 'JPG', top_left_margin, -(PDF_Height * i) + (top_left_margin * 4), canvas_image_width, canvas_image_height);
                            }
                            pdf.save("document.pdf");
                            $(divExportHTML).hide();
                        });
                        break;
                }
            };

            // Ouverture de la boite de dialogue
            var fnOpenFileDialog = function (accept, callback) {
                var inputElement = document.createElement("input");
                inputElement.type = "file";
                inputElement.accept = accept;
                inputElement.addEventListener("change", callback);
                inputElement.dispatchEvent(new MouseEvent("click"));
            };

            // Gestion des events
            this.events = {
                'summernote.change summernote.init': function () {
                    if ($('.note-editable').text().length) {
                        $('.btn-file-save').removeAttr('disabled');
                        $('.btn-file-new').removeAttr('disabled');
                    } else {
                        $('.btn-file-save').attr('disabled', 'disabled');
                        $('.btn-file-new').attr('disabled', 'disabled');
                    }
                },
            };

        }
    });
}));
