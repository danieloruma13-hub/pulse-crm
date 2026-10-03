import {
  Sparkles,
  Send,
  Bot,
} from "lucide-react";

import styles from "./AssistantCard.module.css";


export default function AssistantCard() {

  return (

    <section className={styles.card}>

      <div className={styles.header}>

        <div className={styles.aiIcon}>
          <Sparkles size={20}/>
        </div>

        <div>
          <h2>AI Assistant</h2>
          <p>Always ready to help</p>
        </div>

      </div>


      <div className={styles.message}>

        <div className={styles.bot}>
          <Bot size={18}/>
        </div>


        <div>

          <p>
            Good morning! I found 12 leads that need
            follow-up today.
          </p>

          <span>
            Just now
          </span>

        </div>

      </div>


      <div className={styles.suggestions}>

        <button>
          Analyze sales
        </button>

        <button>
          Find opportunities
        </button>

        <button>
          Improve conversion
        </button>

      </div>


      <div className={styles.input}>

        <input
          placeholder="Ask AI anything..."
        />

        <button>

          <Send size={18}/>

        </button>

      </div>


    </section>

  );

}