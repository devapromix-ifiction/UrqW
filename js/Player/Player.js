/**
 * @author narmiel
 */

var PLAYER_STATUS_NEXT = 0;
var PLAYER_STATUS_END = 1;
var PLAYER_STATUS_ANYKEY = 2;
var PLAYER_STATUS_PAUSE = 3;
var PLAYER_STATUS_INPUT = 4;
var PLAYER_STATUS_QUIT = 5;

var gameMusic = new Audio();

/**
 * @constructor
 */
function Player() {
    var me = this;

    this.Parser = new Parser();
    this.Client = new Client();

    this.text = [];
    this.buttons = [];
    this.inf = false;

    this.procPosition = [];

    this.flow = 0;
    this.flowStack = [];
    this.flowStack[this.flow] = [];

    /**
     * @type {boolean}
     */
    this.lock = false;

    /**
     * системные команды
     */

    /**
     *
     */
    this.continue = function() {
        this.play();

        this.fin();
    };

    /**
     * рендер
     */
    this.fin = function() {
        if (Game.getVar('music')) this.playMusic(Game.getVar('music'), true);

        if (this.status != PLAYER_STATUS_NEXT) {
            this.Client.render({
                status: this.status,
                text: this.text,
                buttons: this.buttons
            });
        }

        this.lock = !(this.status == PLAYER_STATUS_END || this.status == PLAYER_STATUS_PAUSE);
    };

    /**
     *
     */
    this.play = function(line) {
        this.lock = true;

        this.status = PLAYER_STATUS_NEXT;

        if (line !== undefined) {
            this.Parser.parse(line);
        }

        while ((this.status == PLAYER_STATUS_NEXT)) {
            if (this.flowStack[this.flow].length == 0 && ((line = Game.next()) !== false)) {
                this.Parser.parse(line);
            }

            while (this.flowStack[this.flow].length > 0 && this.status == PLAYER_STATUS_NEXT) {
                this.Parser.parse(this.flowStack[this.flow].pop());
            }
        }
    };

    /**
     * добавление команды в текущий поток
     *
     * @param {String} line
     */
    this.flowAdd = function(line) {
        this.flowStack[this.flow].push(line);
    };

    /**
     * команды далее исполняются юзером по ходу игры
     */

    /**
     * коммон
     */
    this.common = function() {
        var commonLabel = 'common';

        if (Game.getVar('urq_mode') != 'ripurq' && Game.getVar('common') !== 0) {
            commonLabel = commonLabel + '_' + Game.getVar('common');
        }

        if (this.proc(commonLabel)) {
            this.forgetProc();
            this.play();
        }
    };

    /**
     * @param {String} labelName
     * @returns {boolean}
     */
    this.btnAction = function(labelName) {
        if (this.lock) return false;

        this.cls();

        this.common();

        if (this.goto(labelName, 'btn')) {
            this.continue();
        }
    };

    /**
     * @param {String} command
     * @returns {boolean}
     */
    this.xbtnAction = function(command) {
        if (this.lock) return false;

        this.common();

        this.play(command + '&end');
        this.fin();
    };

    /**
     * @param {String} labelName
     * @returns {boolean}
     */
    this.useAction = function(labelName) {
        if (this.lock) return false;

        this.play('proc ' + labelName + '&end');
        this.fin();
    };

    /**
     * @param {String} keycode
     * @returns {boolean}
     */
    this.anykeyAction = function(keycode) {
        if (this.inf.length > 0) {
            this.setVar(this.inf, keycode);
        }

        GlobalPlayer.continue();
    };

    /**
     * @param {String} value
     * @returns {boolean}
     */
    this.inputAction = function(value) {
        this.setVar(this.inf, value);

        this.continue();
    };

    /**
     * @inheritDoc
     */
    this.setVar = function(variable, value) {
        if (Game.locked) return false;

        variable = variable.trim();

        if (variable.toLowerCase() === 'style_dos_textcolor') {
            Game.setVar('style_textcolor', dosColorToHex(value));
        } else
        if (variable.toLowerCase() === 'urq_mode') {
            if (value == 'dosurq') {
                Game.setVar('style_backcolor', '#000');
                Game.setVar('style_textcolor', '#FFF');
            }
        } else

        // todo переместить
        if (variable.toLowerCase() === 'image') {
            var file = value;
            if (files != null) {
                if (files[value] !== undefined) {
                    file = value;
                } else if (files[value + '.png'] !== undefined) {
                    file = value + '.png';
                } else if (files[value + '.jpg'] !== undefined) {
                    file = value + '.jpg';
                } else if (files[value + '.gif'] !== undefined) {
                    file = value + '.gif';
                }
            }

            this.image(file);
        }

        Game.setVar(variable, value);
    };

    /**
     * @param {String} src
     */
        // todo переместить в клиента
    this.image = function(src) {
        if (files === null) {
            if (src) {
                this.print($('<img style="margin: 5px auto; display: block;">').attr('src', src).prop('outerHTML'), true);
            }
        } else {
            this.print($('<img style="margin: 5px auto; display: block;">').attr('src', files[src]).prop('outerHTML'), true);
        }
    };

    /**
     * @param {String} src
     * @param {Boolean} loop
     */
    this.playMusic = function(src, loop) {
        var file;

        if (files === null) {
            file = 'quests/' + Game.name + '/' + src;
        } else {
            file = files[src];
        }

        if (src) {
            if (gameMusic.getAttribute('src') != file) {
                gameMusic.src = file;

                if (loop) {
                    gameMusic.addEventListener('ended', function() {
                        gameMusic.src = file;
                        gameMusic.play();
                    }, false);
                }

                gameMusic.play();
            }
        } else {
            gameMusic.pause();
        }
    };

}

