export class HUD {
  constructor(){
    this.startScreen=document.querySelector("#start-screen");
    this.startButton=document.querySelector("#start-button");
    this.objective=document.querySelector("#objective-text");

    this.playerStatus=document.querySelector("#player-status");
    this.playerFill=document.querySelector("#player-health-fill");
    this.playerValue=document.querySelector("#player-health-value");

    this.enemyBar=document.querySelector("#enemy-health");
    this.enemyFill=document.querySelector("#enemy-health-fill");
    this.enemyValue=document.querySelector("#enemy-health-value");
    this.enemyPhase=document.querySelector("#enemy-phase");

    this.prompt=document.querySelector("#interaction-prompt");
    this.promptKey=document.querySelector("#interaction-key");
    this.promptAction=document.querySelector("#interaction-action");

    this.message=document.querySelector("#message-overlay");
    this.messagePanel=document.querySelector("#message-panel");
    this.messageTitle=document.querySelector("#message-title");
    this.messageBody=document.querySelector("#message-body");

    this.flash=document.querySelector("#hud-flash");

    this.previousPlayerRatio=1;
    this.previousEnemyRatio=1;
    this.phaseTwoShown=false;
    this.flashTimer=0;
  }

  onStart(handler){
    this.startButton?.addEventListener("click",handler);
  }

  hideStart(){
    this.startScreen?.classList.add("is-hidden");
    this.startScreen?.setAttribute("aria-hidden","true");
  }

  setObjective(text){
    if(this.objective)this.objective.textContent=text;
  }

  _restartClass(element,className){
    if(!element)return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  setPlayerHealth(ratio){
    const clamped=Math.max(0,Math.min(1,ratio));
    if(this.playerFill){
      const segments=Math.ceil(clamped*16);
      this.playerFill.style.setProperty("--health-segments",String(segments));
      this.playerFill.style.width=(segments/16*100)+"%";
    }
    if(this.playerValue)this.playerValue.textContent=String(Math.ceil(clamped*100)).padStart(3,"0")+"%";

    if(clamped<this.previousPlayerRatio-0.001){
      this._restartClass(this.playerStatus,"is-hit");
      this._restartClass(this.flash,"is-player-hit");
    }

    this.playerStatus?.classList.toggle("is-critical",clamped>0&&clamped<=0.28);
    this.playerStatus?.classList.toggle("is-empty",clamped<=0);
    this.previousPlayerRatio=clamped;
  }

  setEnemyHealth(ratio,visible=true,phaseTwo=false){
    const clamped=Math.max(0,Math.min(1,ratio));
    this.enemyBar?.classList.toggle("is-hidden",!visible);

    if(this.enemyFill){
      const segments=Math.ceil(clamped*24);
      this.enemyFill.style.setProperty("--health-segments",String(segments));
      this.enemyFill.style.width=(segments/24*100)+"%";
    }
    if(this.enemyValue)this.enemyValue.textContent=String(Math.ceil(clamped*100)).padStart(3,"0")+"%";

    if(visible&&clamped<this.previousEnemyRatio-0.001){
      this._restartClass(this.enemyBar,"is-hit");
    }

    if(this.enemyPhase){
      this.enemyPhase.textContent=phaseTwo?"FASE II · DESPERTADO":"FASE I · SELLO VIVO";
      this.enemyPhase.classList.toggle("is-phase-two",phaseTwo);
    }

    if(phaseTwo&&!this.phaseTwoShown){
      this.phaseTwoShown=true;
      this._restartClass(this.enemyBar,"is-phase-change");
    }

    this.previousEnemyRatio=clamped;
  }

  showPrompt(text=""){
    if(!this.prompt)return;

    const active=Boolean(text);
    this.prompt.classList.toggle("is-visible",active);
    if(!active){
      this.prompt.removeAttribute("data-kind");
      return;
    }

    const parts=text.split("·").map((part)=>part.trim()).filter(Boolean);
    const key=parts[0]??"";
    const action=parts.slice(1).join(" · ");

    if(this.promptKey)this.promptKey.textContent=key;
    if(this.promptAction)this.promptAction.textContent=action;

    const upper=action.toUpperCase();
    const kind=upper.includes("ATAC")?"danger":
      upper.includes("DESTR")?"object":
      upper.includes("ALTAR")||upper.includes("ACTIV")?"sanctum":"neutral";
    this.prompt.dataset.kind=kind;
  }

  showMessage(title,body){
    if(this.messageTitle)this.messageTitle.textContent=title;
    if(this.messageBody)this.messageBody.textContent=body;

    const death=title.toUpperCase().includes("CAÍDO");
    this.messagePanel?.classList.toggle("is-death",death);
    this.messagePanel?.classList.toggle("is-victory",!death);
    this.message?.classList.add("is-visible");
  }

  hideMessage(){
    this.message?.classList.remove("is-visible");
  }
}
