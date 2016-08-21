'use strict';

$(function() {

  // Alert message
  if (window.location.protocol === "https:")
    alert("Game only works over http protocol, please visit this page using http in URL. Thanks!");

  /**
   * Hangman game
   *
   * @constructor
   */
  var hangmanGame = (function() {

    /**
     * Game object
     */
    var game = {};

    /**
     * Start a new game with default values
     */
    game.start = function() {
      _showOverlay("Hangman", "Start game");
      _setListeners();
    };

    /**
     * Initializes a new game by fetching a word from Wordnik
     */
    var _init = function() {
      $.get("http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=false&excludePartOfSpeech=adverb&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=3&maxLength=11&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5", function() {
        // show loading animation
      }).done(function(data) {
        game = {
          word: data.word.toLowerCase(),
          fails: [],
          hits: [],
          tries: [],
          steps: [
            '.head--inner',
            '.neck',
            '.body--inner',
            '.arm--wrapper--left .arm',
            '.arm--wrapper--right .arm',
            '.arm--wrapper--left .hand',
            '.arm--wrapper--right .hand',
            '.leg--wrapper--left .leg',
            '.leg--wrapper--right .leg',
            '.leg--wrapper--left .foot',
            '.leg--wrapper--right .foot',
          ],
          solution: _getSolution(data.word),
          lifes: 11
        }
        _showBoard();
        _setListeners();
      }).fail(function() {
        _showOverlay("There was an error", "Try again");
      });
    };

    /**
     * Set event listeners for pressed keys
     */
    var _setListeners = function() {
      if (game.word !== undefined) {
        $(document).on('keypress', function(evt) {
          evt = evt || window.event;
          var charCode = evt.keyCode || evt.which;
          var charStr = String.fromCharCode(charCode);

          if (_isValidLetter(charStr)) _checkLetter(charStr);
        });
      }

      $('.new-game').on('click', function() {
        _init();
        _hideOverlay();
      });
    }

    /**
     * Remove event listeners
     */
    var _offListeners = function() {
      $(document).off('keypress');
    };

    /**
     * Returns the word to be guessed
     */
    var _getWord = function() {
      return game.word;
    }

    /**
     * Sets the game solution
     *
     * @param {String} word
     */
    var _getSolution = function(word) {
      var solution = [];
      for (var i = word.length - 1; i >= 0; i--) {
        if (solution.indexOf(word[i]) === -1) {
          solution.push(word[i]);
        }
      }
      return solution;
    }

    /**
     * Stores the guessed letter if it's a hit
     */
    var _hit = function(letter) {
      game.tries.push(letter);
      game.hits.push(letter);
      for (var i = 0; i < game.word.length; i++) {
        if (game.word.charAt(i) === letter) {
          $('li[data-letter="' + i + '"]').text(letter).addClass('animated flipInY');
        }
      }
      _showToast("It's a hit!");
    }

    /**
     * Store guessed letters in fails array and decrease a life
     */
    var _fail = function(letter) {
      game.tries.push(letter);
      game.fails.push(letter);
      $('.misses').fadeIn().append($('<div></div>').attr('data-missed-letter', letter).text(letter).addClass('animated zoomIn'));
      _decreaseLife();
    };

    /**
     * Decrease a game life
     */
    var _decreaseLife = function() {
      $(game.steps.shift()).show().addClass('animated bounceIn');
      _showToast("-1 life");
      game.lifes -= 1;
    };

    /**
     * Returns whether a game is over or not
     */
    var _isGameOver = function() {
      return game.lifes <= 0;
    };

    /**
     * Returns true if the word was guessed
     */
    var _isWin = function() {
      return (game.hits.length === game.solution.length);
    }

    /**
     * Checks whether a key is a hit or not
     *
     * @param {String} letter
     */
    var _checkLetter = function(letter) {
      if (_isRepeated(letter)) {
        $('div[data-missed-letter="' + letter + '"]').removeClass().addClass('animated shake');
      } else {
        if (game.word.indexOf(letter) != -1) {
          _hit(letter);
        } else {
          _fail(letter);
        }
        _checkGameState();
      }
    };

    /**
     * Checks whether the game is finished (win or game over) or not
     */
    var _checkGameState = function() {
      if (_isWin()) {
        _offListeners();
        _showOverlay('You won!', 'Play again');
      } else if (_isGameOver()) {
        _offListeners();
        _showOverlay('Game over :(', 'Try again');
      }
    };

    /*
     * Returns true if a letter matches the regex
     */
    var _isValidLetter = function(letter) {
      return /^[a-zA-Z-]+$/.test(letter);
    };

    /**
     * Returns true if a letter has been already tried
     *
     * @param {String} letter
     */
    var _isRepeated = function(letter) {
      return (game.tries.indexOf(letter) !== -1);
    }

    /**
     * Show toast with custom message
     */
    var _showToast = function(message) {
      $('.toast').remove();
      $('.content').append($('<div></div>').text(message).addClass("toast animated fadeOutUp"));
    };

    /**
     * Create board elements and add effects
     */
    var _showBoard = function() {

      // Show bar
      $('.bar').show().addClass('animated bounceIn');

      // Hide man
      $.each(game.steps, function(index, step) {
        $(step).removeClass('animated bounceIn').fadeOut();
      });

      // Empty letters board
      var letterList = $('.word').empty();

      // Clear missed letters
      $('.misses').fadeOut().find('div').remove();

      // Fill letters board
      for (var i = 0, fill = game.lifes - game.word.length; i < game.lifes; i++) {
        // Fill playable letters
        if (i >= fill) {
          letterList.append($('<li></li>').attr('data-letter', i - fill).addClass('animated fadeIn fill'));
        } else {
          letterList.append($('<li></li>').addClass('animated fadeIn'));
        }
      }
    }

    /**
     * Show overlay with message and custom button text
     *
     * @param {String} message
     * @param {String} buttonText
     */
    var _showOverlay = function(message, buttonText) {
      $('.overlay').delay(300).fadeIn().find('.message').text(message).addClass('animated tada').next().text(buttonText).addClass('animated bounceIn');
    }

    /**
     * Hide overlay
     */
    var _hideOverlay = function() {
      $('.overlay').fadeOut();
    }

    return game.start;

  })();

  // Start the game
  hangmanGame();

});
