import { useState } from "react";
import styles from "./faq.module.css"; 

const FAQ = () => {
  const faqData = [
    {
      question: "What is CareConnect?",
      answer:
        "CareConnect is a platform that connects NGOs, orphanages, and donors to facilitate donations and event management.",
    },
    {
      question: "How can I donate?",
      answer:
        "You can donate by creating an account, selecting an NGO or event, and choosing your preferred donation method.",
    },
    {
      question: "Is my donation secure?",
      answer:
        "Yes! We use secure payment gateways to ensure your donations reach the right people safely.",
    },
    {
      question: "Can NGOs create fundraising campaigns?",
      answer:
        "Yes! Registered NGOs can create and manage fundraising campaigns through their dashboard.",
    },
    {
      question: "How do I know if my donation has reached the beneficiary?",
      answer:
        "After your donation is processed, you will receive a confirmation email and a receipt. Many NGOs also provide updates, impact reports, or acknowledgment messages on their campaign pages. You can check your donation status in your Donor Dashboard.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles["faq-container"]}>
      <h2 className={styles["faq-header"]}>Frequently Asked Questions</h2>

      {faqData.map((faq, idx) => (
        <div key={idx} className={styles["faq"]}>
          <div
            className={styles["faq-question"]}
            onClick={() => toggleFAQ(idx)}
          >
            <span>{faq.question}</span>
            <span className={styles["faq-toggle"]}>
              {openIndex === idx ? "-" : "+"}
            </span>
          </div>
          <div
            className={styles["faq-answer"]}
            style={{ display: openIndex === idx ? "block" : "none" }}
          >
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FAQ;
