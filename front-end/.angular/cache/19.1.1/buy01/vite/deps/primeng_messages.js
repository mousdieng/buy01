import {
  animate,
  style,
  transition,
  trigger
} from "./chunk-RV4YVARO.js";
import {
  Button,
  ButtonModule
} from "./chunk-LO5ELCKZ.js";
import "./chunk-KU6QBHTK.js";
import "./chunk-5G7WYC4N.js";
import {
  Ripple
} from "./chunk-UOZYAYQ3.js";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  TimesCircleIcon,
  TimesIcon
} from "./chunk-HAVHVRWV.js";
import "./chunk-RTUEET3J.js";
import {
  BaseComponent
} from "./chunk-T7XVJYS3.js";
import "./chunk-6OOZA3TX.js";
import {
  BaseStyle
} from "./chunk-NHAIB6GX.js";
import "./chunk-CWYBPNCF.js";
import {
  MessageService,
  PrimeTemplate,
  SharedModule
} from "./chunk-AOFWADGX.js";
import "./chunk-NJ25EVEJ.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet
} from "./chunk-6HM46HDU.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  Injectable,
  Input,
  NgModule,
  Optional,
  Output,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵInheritDefinitionFeature,
  ɵɵInputTransformsFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsetNgModuleScope,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-HH4NLXCO.js";
import "./chunk-4N4GOYJH.js";
import "./chunk-5OPE3T2R.js";
import {
  timer
} from "./chunk-FHTVLBLO.js";
import "./chunk-WDMUDEB6.js";

// node_modules/primeng/fesm2022/primeng-messages.mjs
var theme = ({
  dt
}) => `
.p-messages {
    display: flex;
    flex-direction: column;
    position: relative;
    gap: ${dt("message.content.gap")};
}

.p-message {
    border-radius: ${dt("message.border.radius")};
    outline-width: ${dt("message.border.width")};
    outline-style: solid;
}

.p-message-content {
    display: flex;
    align-items: center;
    padding: ${dt("message.content.padding")};
    height: 100%;
}

.p-message .p-message-content:has(:nth-child(1)) {
    gap: ${dt("message.content.gap")};
}

.p-message-icon {
    flex-shrink: 0;
}

.p-message-close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0 0 0 auto;
    overflow: hidden;
    position: relative;
    width: ${dt("message.close.button.width")};
    height: ${dt("message.close.button.height")};
    border-radius: ${dt("message.close.button.border.radius")};
    background: transparent;
    transition: background ${dt("message.transition.duration")}, color ${dt("message.transition.duration")}, outline-color ${dt("message.transition.duration")}, box-shadow ${dt("message.transition.duration")}, opacity 0.3s;
    outline-color: transparent;
    color: inherit;
    padding: 0;
    border: none;
    cursor: pointer;
    user-select: none;
}

.p-message-close-icon {
    font-size: ${dt("message.close.icon.size")};
    width: ${dt("message.close.icon.size")};
    height: ${dt("message.close.icon.size")};
}

.p-message-close-button:focus-visible {
    outline-width: ${dt("message.close.button.focus.ring.width")};
    outline-style: ${dt("message.close.button.focus.ring.style")};
    outline-offset: ${dt("message.close.button.focus.ring.offset")};
}

.p-message-info {
    background: ${dt("message.info.background")};
    outline-color: ${dt("message.info.border.color")};
    color: ${dt("message.info.color")};
    box-shadow: ${dt("message.info.shadow")};
}

.p-message-info .p-message-close-button:focus-visible {
    outline-color: ${dt("message.info.close.button.focus.ring.color")};
    box-shadow: ${dt("message.info.close.button.focus.ring.shadow")};
}

.p-message-info .p-message-close-button:hover {
    background: ${dt("message.info.close.button.hover.background")};
}

.p-message-success {
    background: ${dt("message.success.background")};
    outline-color: ${dt("message.success.border.color")};
    color: ${dt("message.success.color")};
    box-shadow: ${dt("message.success.shadow")};
}

.p-message-success .p-message-close-button:focus-visible {
    outline-color: ${dt("message.success.close.button.focus.ring.color")};
    box-shadow: ${dt("message.success.close.button.focus.ring.shadow")};
}

.p-message-success .p-message-close-button:hover {
    background: ${dt("message.success.close.button.hover.background")};
}

.p-message-warn {
    background: ${dt("message.warn.background")};
    outline-color: ${dt("message.warn.border.color")};
    color: ${dt("message.warn.color")};
    box-shadow: ${dt("message.warn.shadow")};
}

.p-message-warn .p-message-close-button:focus-visible {
    outline-color: ${dt("message.warn.close.button.focus.ring.color")};
    box-shadow: ${dt("message.warn.close.button.focus.ring.shadow")};
}

.p-message-warn .p-message-close-button:hover {
    background: ${dt("message.warn.close.button.hover.background")};
}

.p-message-error {
    background: ${dt("message.error.background")};
    outline-color: ${dt("message.error.border.color")};
    color: ${dt("message.error.color")};
    box-shadow: ${dt("message.error.shadow")};
}

.p-message-error .p-message-close-button:focus-visible {
    outline-color: ${dt("message.error.close.button.focus.ring.color")};
    box-shadow: ${dt("message.error.close.button.focus.ring.shadow")};
}

.p-message-error .p-message-close-button:hover {
    background: ${dt("message.error.close.button.hover.background")};
}

.p-message-secondary {
    background: ${dt("message.secondary.background")};
    outline-color: ${dt("message.secondary.border.color")};
    color: ${dt("message.secondary.color")};
    box-shadow: ${dt("message.secondary.shadow")};
}

.p-message-secondary .p-message-close-button:focus-visible {
    outline-color: ${dt("message.secondary.close.button.focus.ring.color")};
    box-shadow: ${dt("message.secondary.close.button.focus.ring.shadow")};
}

.p-message-secondary .p-message-close-button:hover {
    background: ${dt("message.secondary.close.button.hover.background")};
}

.p-message-contrast {
    background: ${dt("message.contrast.background")};
    outline-color: ${dt("message.contrast.border.color")};
    color: ${dt("message.contrast.color")};
    box-shadow: ${dt("message.contrast.shadow")};
}

.p-message-contrast .p-message-close-button:focus-visible {
    outline-color: ${dt("message.contrast.close.button.focus.ring.color")};
    box-shadow: ${dt("message.contrast.close.button.focus.ring.shadow")};
}

.p-message-contrast .p-message-close-button:hover {
    background: ${dt("message.contrast.close.button.hover.background")};
}

.p-message-text {
    font-size: ${dt("message.text.font.size")};
    font-weight: ${dt("message.text.font.weight")};
}

.p-message-icon {
    font-size: ${dt("message.icon.size")};
    width: ${dt("message.icon.size")};
    height: ${dt("message.icon.size")};
}

.p-message-enter-from {
    opacity: 0;
}

.p-message-enter-active {
    transition: opacity 0.3s;
}

.p-message.p-message-leave-from {
    max-height: 1000px;
}

.p-message.p-message-leave-to {
    max-height: 0;
    opacity: 0;
    margin: 0;
}

.p-message-leave-active {
    overflow: hidden;
    transition: max-height 0.45s cubic-bezier(0, 1, 0, 1), opacity 0.3s, margin 0.3s;
}

.p-message-leave-active .p-message-close-button {
    opacity: 0;
}
/* For PrimeNG */
.p-messages .p-message.ng-animating {
    overflow: hidden;
}

.p-message-content > p-button[data-pc-section="closebutton"] {
    margin-left: auto;
}
`;
var classes = {
  root: ({
    instance
  }) => ({
    "p-message": true
  }),
  container: "p-messages p-component",
  content: "p-message-content",
  icon: "p-message-icon",
  text: "p-message-text",
  closeButton: "p-message-close-button",
  closeIcon: "p-message-close-icon"
};
var MessagesStyle = class _MessagesStyle extends BaseStyle {
  name = "message";
  theme = theme;
  classes = classes;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵMessagesStyle_BaseFactory;
    return function MessagesStyle_Factory(__ngFactoryType__) {
      return (ɵMessagesStyle_BaseFactory || (ɵMessagesStyle_BaseFactory = ɵɵgetInheritedFactory(_MessagesStyle)))(__ngFactoryType__ || _MessagesStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _MessagesStyle,
    factory: _MessagesStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MessagesStyle, [{
    type: Injectable
  }], null, null);
})();
var _c0 = (a0, a1) => ({
  showTransitionParams: a0,
  hideTransitionParams: a1
});
var _c1 = (a0) => ({
  value: "visible",
  params: a0
});
function Messages_Conditional_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Messages_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 1);
    ɵɵtemplate(1, Messages_Conditional_1_ng_container_1_Template, 1, 0, "ng-container", 3);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵproperty("ngClass", "p-message p-message-" + ctx_r0.severity);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.contentTemplate);
  }
}
function Messages_Conditional_2_div_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 5);
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext().$implicit;
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵclassMap("pi " + msg_r2.icon);
    ɵɵproperty("ngClass", ctx_r0.cx("icon"));
    ɵɵattribute("data-pc-section", "icon");
  }
}
function Messages_Conditional_2_div_0_Conditional_3_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "CheckIcon");
  }
  if (rf & 2) {
    ɵɵattribute("data-pc-section", "icon");
  }
}
function Messages_Conditional_2_div_0_Conditional_3_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "TimesCircleIcon");
  }
  if (rf & 2) {
    ɵɵattribute("data-pc-section", "icon");
  }
}
function Messages_Conditional_2_div_0_Conditional_3_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "TimesCircleIcon");
  }
  if (rf & 2) {
    ɵɵattribute("data-pc-section", "icon");
  }
}
function Messages_Conditional_2_div_0_Conditional_3_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ExclamationTriangleIcon");
  }
  if (rf & 2) {
    ɵɵattribute("data-pc-section", "icon");
  }
}
function Messages_Conditional_2_div_0_Conditional_3_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "InfoCircleIcon");
  }
  if (rf & 2) {
    ɵɵattribute("data-pc-section", "icon");
  }
}
function Messages_Conditional_2_div_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 5);
    ɵɵtemplate(1, Messages_Conditional_2_div_0_Conditional_3_Case_1_Template, 1, 1, "CheckIcon")(2, Messages_Conditional_2_div_0_Conditional_3_Case_2_Template, 1, 1, "TimesCircleIcon")(3, Messages_Conditional_2_div_0_Conditional_3_Case_3_Template, 1, 1, "TimesCircleIcon")(4, Messages_Conditional_2_div_0_Conditional_3_Case_4_Template, 1, 1, "ExclamationTriangleIcon")(5, Messages_Conditional_2_div_0_Conditional_3_Case_5_Template, 1, 1, "InfoCircleIcon");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    let tmp_6_0;
    const msg_r2 = ɵɵnextContext().$implicit;
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ctx_r0.cx("icon"));
    ɵɵadvance();
    ɵɵconditional((tmp_6_0 = msg_r2.icon) === "success" ? 1 : tmp_6_0 === "error" ? 2 : tmp_6_0 === "danger" ? 3 : tmp_6_0 === "warn" ? 4 : 5);
  }
}
function Messages_Conditional_2_div_0_Conditional_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 5);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext(2).$implicit;
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ctx_r0.cx("text"));
    ɵɵadvance();
    ɵɵtextInterpolate(msg_r2.text);
  }
}
function Messages_Conditional_2_div_0_Conditional_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 5);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext(2).$implicit;
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ctx_r0.cx("text", "p-message-summary"));
    ɵɵattribute("data-pc-section", "summary");
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", msg_r2.summary, " ");
  }
}
function Messages_Conditional_2_div_0_Conditional_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 5);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext(2).$implicit;
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ctx_r0.cx("text", "p-message-detail"));
    ɵɵattribute("data-pc-section", "detail");
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", msg_r2.detail, " ");
  }
}
function Messages_Conditional_2_div_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, Messages_Conditional_2_div_0_Conditional_4_Conditional_0_Template, 2, 2, "span", 5)(1, Messages_Conditional_2_div_0_Conditional_4_Conditional_1_Template, 2, 3, "span", 5)(2, Messages_Conditional_2_div_0_Conditional_4_Conditional_2_Template, 2, 3, "span", 5);
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext().$implicit;
    ɵɵconditional(msg_r2.text ? 0 : -1);
    ɵɵadvance();
    ɵɵconditional(msg_r2.summary ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(msg_r2.detail ? 2 : -1);
  }
}
function Messages_Conditional_2_div_0_Conditional_5_span_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 10);
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext(2).$implicit;
    ɵɵproperty("innerHTML", msg_r2.summary, ɵɵsanitizeHtml);
    ɵɵattribute("data-pc-section", "summary");
  }
}
function Messages_Conditional_2_div_0_Conditional_5_span_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 11);
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext(2).$implicit;
    ɵɵproperty("innerHTML", msg_r2.detail, ɵɵsanitizeHtml);
    ɵɵattribute("data-pc-section", "detail");
  }
}
function Messages_Conditional_2_div_0_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, Messages_Conditional_2_div_0_Conditional_5_span_0_Template, 1, 2, "span", 8)(1, Messages_Conditional_2_div_0_Conditional_5_span_1_Template, 1, 2, "span", 9);
  }
  if (rf & 2) {
    const msg_r2 = ɵɵnextContext().$implicit;
    ɵɵproperty("ngIf", msg_r2.summary);
    ɵɵadvance();
    ɵɵproperty("ngIf", msg_r2.detail);
  }
}
function Messages_Conditional_2_div_0_p_button_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "p-button", 12);
    ɵɵlistener("onClick", function Messages_Conditional_2_div_0_p_button_6_Template_p_button_onClick_0_listener() {
      ɵɵrestoreView(_r3);
      const i_r4 = ɵɵnextContext().index;
      const ctx_r0 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r0.removeMessage(i_r4));
    });
    ɵɵelement(1, "TimesIcon", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(3);
    ɵɵproperty("styleClass", ctx_r0.cx("closeButton"))("ariaLabel", ctx_r0.closeAriaLabel);
    ɵɵattribute("data-pc-section", "closebutton");
    ɵɵadvance();
    ɵɵproperty("ngClass", ctx_r0.cx("closeIcon"));
    ɵɵattribute("data-pc-section", "closeicon");
  }
}
function Messages_Conditional_2_div_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 1)(1, "div", 5);
    ɵɵtemplate(2, Messages_Conditional_2_div_0_Conditional_2_Template, 1, 4, "span", 6)(3, Messages_Conditional_2_div_0_Conditional_3_Template, 6, 2, "span", 5)(4, Messages_Conditional_2_div_0_Conditional_4_Template, 3, 3)(5, Messages_Conditional_2_div_0_Conditional_5_Template, 2, 2)(6, Messages_Conditional_2_div_0_p_button_6_Template, 2, 5, "p-button", 7);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_12_0;
    const msg_r2 = ctx.$implicit;
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵclassMap("p-message-" + msg_r2.severity);
    ɵɵproperty("ngClass", ctx_r0.cx("root"))("@messageAnimation", ɵɵpureFunction1(13, _c1, ɵɵpureFunction2(10, _c0, ctx_r0.showTransitionOptions, ctx_r0.hideTransitionOptions)));
    ɵɵadvance();
    ɵɵproperty("ngClass", ctx_r0.cx("content"));
    ɵɵattribute("data-pc-section", "wrapper")("id", msg_r2.id || null);
    ɵɵadvance();
    ɵɵconditional(msg_r2.icon ? 2 : 3);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r0.escape ? 4 : 5);
    ɵɵadvance(2);
    ɵɵproperty("ngIf", ctx_r0.closable && ((tmp_12_0 = msg_r2.closable) !== null && tmp_12_0 !== void 0 ? tmp_12_0 : true));
  }
}
function Messages_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, Messages_Conditional_2_div_0_Template, 7, 15, "div", 4);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵproperty("ngForOf", ctx_r0.messages);
  }
}
var Messages = class _Messages extends BaseComponent {
  messageService;
  /**
   * An array of messages to display.
   * @group Props
   */
  set value(messages) {
    this.messages = messages;
    this.startMessageLifes(this.messages);
  }
  /**
   * Defines if message box can be closed by the click icon.
   * @group Props
   */
  closable = true;
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Style class of the component.
   * @group Props
   */
  styleClass;
  /**
   * Whether displaying services messages are enabled.
   * @group Props
   */
  enableService = true;
  /**
   * Id to match the key of the message to enable scoping in service based messaging.
   * @group Props
   */
  key;
  /**
   * Whether displaying messages would be escaped or not.
   * @group Props
   */
  escape = true;
  /**
   * Severity level of the message.
   * @group Props
   */
  severity;
  /**
   * Transition options of the show animation.
   * @group Props
   */
  showTransitionOptions = "300ms ease-out";
  /**
   * Transition options of the hide animation.
   * @group Props
   */
  hideTransitionOptions = "200ms cubic-bezier(0.86, 0, 0.07, 1)";
  /**
   * This function is executed when the value changes.
   * @param {ToastMessageOptions[]} value - messages value.
   * @group Emits
   */
  valueChange = new EventEmitter();
  /**
   * This function is executed when a message is closed.
   * @param {ToastMessageOptions} value - Closed message.
   * @group Emits
   */
  onClose = new EventEmitter();
  messages;
  messageSubscription;
  clearSubscription;
  timerSubscriptions = [];
  contentTemplate;
  _componentStyle = inject(MessagesStyle);
  constructor(messageService) {
    super();
    this.messageService = messageService;
    console.log("Messages component is deprecated as of v18. Use Message component instead.");
  }
  templates;
  ngAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case "content":
          this.contentTemplate = item.template;
          break;
        default:
          this.contentTemplate = item.template;
          break;
      }
    });
    if (this.messageService && this.enableService && !this.contentTemplate) {
      this.messageSubscription = this.messageService.messageObserver.subscribe((messages) => {
        if (messages) {
          if (!Array.isArray(messages)) {
            messages = [messages];
          }
          const filteredMessages = messages.filter((m) => this.key === m.key);
          this.messages = this.messages ? [...this.messages, ...filteredMessages] : [...filteredMessages];
          this.startMessageLifes(filteredMessages);
          this.cd.markForCheck();
        }
      });
      this.clearSubscription = this.messageService.clearObserver.subscribe((key) => {
        if (key) {
          if (this.key === key) {
            this.messages = null;
          }
        } else {
          this.messages = null;
        }
        this.cd.markForCheck();
      });
    }
  }
  hasMessages() {
    let parentEl = this.el.nativeElement.parentElement;
    if (parentEl && parentEl.offsetParent) {
      return this.contentTemplate != null || this.messages && this.messages.length > 0;
    }
    return false;
  }
  clear() {
    this.messages = [];
    this.valueChange.emit(this.messages);
  }
  removeMessage(i) {
    const removedMessage = this.messages[i];
    this.messages = this.messages?.filter((msg, index) => index !== i);
    removedMessage && this.onClose.emit(removedMessage);
    this.valueChange.emit(this.messages);
  }
  get icon() {
    const severity = this.severity || (this.hasMessages() ? this.messages[0].severity : null);
    if (this.hasMessages()) {
      switch (severity) {
        case "success":
          return "pi-check";
        case "info":
          return "pi-info-circle";
        case "error":
        case "danger":
          return "pi-times";
        case "warn":
          return "pi-exclamation-triangle";
        default:
          return "pi-info-circle";
      }
    }
    return null;
  }
  get closeAriaLabel() {
    return this.config.translation.aria ? this.config.translation.aria.close : void 0;
  }
  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.clearSubscription) {
      this.clearSubscription.unsubscribe();
    }
    this.timerSubscriptions?.forEach((subscription) => subscription.unsubscribe());
    super.ngOnDestroy();
  }
  startMessageLifes(messages) {
    messages?.forEach((message) => message.life && this.startMessageLife(message));
  }
  startMessageLife(message) {
    const timerSubsctiption = timer(message.life).subscribe(() => {
      this.messages = this.messages?.filter((msgEl) => msgEl !== message);
      this.timerSubscriptions = this.timerSubscriptions?.filter((timerEl) => timerEl !== timerSubsctiption);
      this.valueChange.emit(this.messages);
      this.cd.markForCheck();
    });
    this.timerSubscriptions.push(timerSubsctiption);
  }
  static ɵfac = function Messages_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Messages)(ɵɵdirectiveInject(MessageService, 8));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _Messages,
    selectors: [["p-messages"]],
    contentQueries: function Messages_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    inputs: {
      value: "value",
      closable: [2, "closable", "closable", booleanAttribute],
      style: "style",
      styleClass: "styleClass",
      enableService: [2, "enableService", "enableService", booleanAttribute],
      key: "key",
      escape: [2, "escape", "escape", booleanAttribute],
      severity: "severity",
      showTransitionOptions: "showTransitionOptions",
      hideTransitionOptions: "hideTransitionOptions"
    },
    outputs: {
      valueChange: "valueChange",
      onClose: "onClose"
    },
    standalone: false,
    features: [ɵɵProvidersFeature([MessagesStyle]), ɵɵInputTransformsFeature, ɵɵInheritDefinitionFeature],
    decls: 3,
    vars: 8,
    consts: [["role", "alert", 3, "ngClass", "ngStyle"], ["role", "alert", 3, "ngClass"], ["role", "alert", 3, "ngClass", "class"], [4, "ngTemplateOutlet"], ["role", "alert", 3, "ngClass", "class", 4, "ngFor", "ngForOf"], [3, "ngClass"], [3, "ngClass", "class"], ["rounded", "", "text", "", "severity", "secondary", 3, "styleClass", "ariaLabel", "onClick", 4, "ngIf"], ["class", "p-message-summary", 3, "innerHTML", 4, "ngIf"], ["class", "p-message-detail", 3, "innerHTML", 4, "ngIf"], [1, "p-message-summary", 3, "innerHTML"], [1, "p-message-detail", 3, "innerHTML"], ["rounded", "", "text", "", "severity", "secondary", 3, "onClick", "styleClass", "ariaLabel"]],
    template: function Messages_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "div", 0);
        ɵɵtemplate(1, Messages_Conditional_1_Template, 2, 2, "div", 1)(2, Messages_Conditional_2_Template, 1, 1, "div", 2);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", ctx.cx("container"))("ngStyle", ctx.style);
        ɵɵattribute("aria-atomic", true)("aria-live", "assertive")("data-pc-name", "message");
        ɵɵadvance();
        ɵɵconditional(ctx.contentTemplate ? 1 : 2);
      }
    },
    dependencies: () => [NgClass, NgForOf, NgIf, NgTemplateOutlet, NgStyle, CheckIcon, InfoCircleIcon, TimesCircleIcon, ExclamationTriangleIcon, TimesIcon, Button],
    encapsulation: 2,
    data: {
      animation: [trigger("messageAnimation", [transition(":enter", [style({
        opacity: 0,
        transform: "translateY(-25%)"
      }), animate("{{showTransitionParams}}")]), transition(":leave", [animate("{{hideTransitionParams}}", style({
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        opacity: 0
      }))])])]
    },
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Messages, [{
    type: Component,
    args: [{
      selector: "p-messages",
      standalone: false,
      template: `
        <div [ngClass]="cx('container')" role="alert" [ngStyle]="style" [class]="styleClass" [attr.aria-atomic]="true" [attr.aria-live]="'assertive'" [attr.data-pc-name]="'message'">
            @if (contentTemplate) {
                <div [ngClass]="'p-message p-message-' + severity" role="alert">
                    <ng-container *ngTemplateOutlet="contentTemplate"></ng-container>
                </div>
            } @else {
                <div
                    *ngFor="let msg of messages; let i = index"
                    [ngClass]="cx('root')"
                    [class]="'p-message-' + msg.severity"
                    role="alert"
                    [@messageAnimation]="{
                        value: 'visible',
                        params: {
                            showTransitionParams: showTransitionOptions,
                            hideTransitionParams: hideTransitionOptions
                        }
                    }"
                >
                    <div [ngClass]="cx('content')" [attr.data-pc-section]="'wrapper'" [attr.id]="msg.id || null">
                        @if (msg.icon) {
                            <span [ngClass]="cx('icon')" [class]="'pi ' + msg.icon" [attr.data-pc-section]="'icon'"> </span>
                        } @else {
                            <span [ngClass]="cx('icon')">
                                @switch (msg.icon) {
                                    @case ('success') {
                                        <CheckIcon [attr.data-pc-section]="'icon'" />
                                    }
                                    @case ('error') {
                                        <TimesCircleIcon [attr.data-pc-section]="'icon'" />
                                    }
                                    @case ('danger') {
                                        <TimesCircleIcon [attr.data-pc-section]="'icon'" />
                                    }
                                    @case ('warn') {
                                        <ExclamationTriangleIcon [attr.data-pc-section]="'icon'" />
                                    }
                                    @default {
                                        <InfoCircleIcon [attr.data-pc-section]="'icon'" />
                                    }
                                }
                            </span>
                        }
                        @if (escape) {
                            @if (msg.text) {
                                <span [ngClass]="cx('text')">{{ msg.text }}</span>
                            }
                            @if (msg.summary) {
                                <span [ngClass]="cx('text', 'p-message-summary')" [attr.data-pc-section]="'summary'">
                                    {{ msg.summary }}
                                </span>
                            }
                            @if (msg.detail) {
                                <span [ngClass]="cx('text', 'p-message-detail')" [attr.data-pc-section]="'detail'">
                                    {{ msg.detail }}
                                </span>
                            }
                        } @else {
                            <span *ngIf="msg.summary" class="p-message-summary" [innerHTML]="msg.summary" [attr.data-pc-section]="'summary'"></span>
                            <span *ngIf="msg.detail" class="p-message-detail" [innerHTML]="msg.detail" [attr.data-pc-section]="'detail'"></span>
                        }
                        <p-button *ngIf="closable && (msg.closable ?? true)" rounded text severity="secondary" [styleClass]="cx('closeButton')" (onClick)="removeMessage(i)" [ariaLabel]="closeAriaLabel" [attr.data-pc-section]="'closebutton'">
                            <TimesIcon [ngClass]="cx('closeIcon')" [attr.data-pc-section]="'closeicon'" />
                        </p-button>
                    </div>
                </div>
            }
        </div>
    `,
      animations: [trigger("messageAnimation", [transition(":enter", [style({
        opacity: 0,
        transform: "translateY(-25%)"
      }), animate("{{showTransitionParams}}")]), transition(":leave", [animate("{{hideTransitionParams}}", style({
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        opacity: 0
      }))])])],
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      providers: [MessagesStyle]
    }]
  }], () => [{
    type: MessageService,
    decorators: [{
      type: Optional
    }]
  }], {
    value: [{
      type: Input
    }],
    closable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    style: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    enableService: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    key: [{
      type: Input
    }],
    escape: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    severity: [{
      type: Input
    }],
    showTransitionOptions: [{
      type: Input
    }],
    hideTransitionOptions: [{
      type: Input
    }],
    valueChange: [{
      type: Output
    }],
    onClose: [{
      type: Output
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && ɵsetClassDebugInfo(Messages, {
    className: "Messages",
    filePath: "messages.ts",
    lineNumber: 112
  });
})();
var MessagesModule = class _MessagesModule {
  static ɵfac = function MessagesModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MessagesModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MessagesModule
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, CheckIcon, InfoCircleIcon, TimesCircleIcon, ExclamationTriangleIcon, TimesIcon, ButtonModule, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MessagesModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule, Ripple, CheckIcon, InfoCircleIcon, TimesCircleIcon, ExclamationTriangleIcon, TimesIcon, ButtonModule, SharedModule],
      exports: [Messages, SharedModule],
      declarations: [Messages]
    }]
  }], null, null);
})();
(function() {
  (typeof ngJitMode === "undefined" || ngJitMode) && ɵɵsetNgModuleScope(MessagesModule, {
    declarations: [Messages],
    imports: [CommonModule, Ripple, CheckIcon, InfoCircleIcon, TimesCircleIcon, ExclamationTriangleIcon, TimesIcon, ButtonModule, SharedModule],
    exports: [Messages, SharedModule]
  });
})();
export {
  Messages,
  MessagesModule,
  MessagesStyle
};
//# sourceMappingURL=primeng_messages.js.map
