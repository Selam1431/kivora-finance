
package com.kivora.backend.service;
import com.kivora.backend.model.Transaction;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

/**
 * Manages financial transactions for Kivora Finance.
 *
 * Handles transaction creation, updates, deletion,
 * CSV persistence, and loading saved records.
 */
@Service
public class TransactionService {

    private final ArrayList<Transaction> transactions;
    private static final String FILE_PATH = "backend-transactions.csv";
    private final Path storageFile;

    /**
     * Creates the transaction service using the configured storage file.
     *
     * @param filePath the CSV file path provided by application configuration
     */
    @Autowired
    public TransactionService(
            @Value("${kivora.transactions.file:" + FILE_PATH + "}") String filePath) {
        this(Path.of(filePath));
    }


    /**
     * Initializes the service and loads existing transactions.
     *
     * @param storageFile the path to the transaction CSV file
     */
    public TransactionService(Path storageFile) {
        transactions = new ArrayList<>();
        this.storageFile = storageFile;
        loadTransactions();
    }

    /**
     * Creates a transaction with a unique ID and saves it.
     *
     * @param transaction the transaction to add
     * @return the newly saved transaction
     */
    public synchronized Transaction addTransaction(Transaction transaction) {
        Transaction saved = copyWithId(transaction, UUID.randomUUID());
        ArrayList<Transaction> next = new ArrayList<>(transactions);
        next.add(saved);

        // save first then update the list in memory
        persist(next);
        replaceInMemory(next);
        return copy(saved);
    }

    /**
     * Updates an existing transaction while preserving its ID.
     *
     * @param id the ID of the transaction to update
     * @param updated the new transaction details
     * @return the updated transaction
     * @throws TransactionNotFoundException if the ID does not exist
     */
    public synchronized Transaction updateTransaction(UUID id, Transaction updated) {
        int index = findIndex(id);
        if (index < 0) throw new TransactionNotFoundException(id);

        ArrayList<Transaction> next = new ArrayList<>(transactions);
        Transaction replacement = copyWithId(updated, id);
        next.set(index, replacement);
        persist(next);
        replaceInMemory(next);
        return copy(replacement);
    }

    /**
     * Deletes a transaction from memory and CSV storage.
     *
     * @param id the ID of the transaction to delete
     * @throws TransactionNotFoundException if the ID does not exist
     */
    public synchronized void deleteTransaction(UUID id) {
        int index = findIndex(id);
        if (index < 0) throw new TransactionNotFoundException(id);

        ArrayList<Transaction> next = new ArrayList<>(transactions);
        next.remove(index);
        persist(next);
        replaceInMemory(next);
    }

    /**
     * Loads transactions from CSV storage into memory.
     *
     * Also migrates legacy records by assigning unique IDs.
     *
     * @throws IllegalStateException if the file cannot be read
     *                               or contains invalid records
     */
    public synchronized void loadTransactions() {
        if (!Files.exists(storageFile)) {
            replaceInMemory(new ArrayList<>());
            return;
        }

        ArrayList<Transaction> loaded = new ArrayList<>();
        Set<UUID> ids = new HashSet<>();
        boolean migrationNeeded = false;
        try {
            List<String> lines = Files.readAllLines(storageFile, StandardCharsets.UTF_8);
            for (int lineNumber = 0; lineNumber < lines.size(); lineNumber++) {
                String line = lines.get(lineNumber);
                if (line.isBlank()) continue;
                try {
                    String[] fields = parseRecord(line);
                    Transaction transaction;
                    if (fields.length == 5) {
                        transaction = new Transaction(UUID.randomUUID(),
                                LocalDate.parse(fields[0]), LocalTime.parse(fields[1]),
                                fields[2], fields[3], new BigDecimal(fields[4]));
                        migrationNeeded = true;
                    } else if (fields.length == 6) {
                        transaction = new Transaction(UUID.fromString(fields[0]),
                                LocalDate.parse(fields[1]), LocalTime.parse(fields[2]),
                                fields[3], fields[4], new BigDecimal(fields[5]));
                    } else {
                        throw new IllegalArgumentException("Expected five legacy or six current fields");
                    }
                    if (transaction.getDate() == null || transaction.getTime() == null ||
                            transaction.getDescription() == null || transaction.getDescription().isBlank() ||
                            transaction.getVendor() == null || transaction.getVendor().isBlank() ||
                            transaction.getAmount() == null || transaction.getAmount().compareTo(BigDecimal.ZERO) == 0) {
                        throw new IllegalArgumentException("Required transaction values are missing or invalid");
                    }
                    if (!ids.add(transaction.getId())) {
                        throw new IllegalArgumentException("Duplicate transaction ID");
                    }
                    loaded.add(transaction);
                } catch (RuntimeException exception) {
                    throw new IllegalStateException(
                            "Cannot load transaction record at line " + (lineNumber + 1) +
                                    "; original data was left untouched.", exception);
                }
            }

            // Migration is a single atomic replacement; never append migrated rows.
            if (migrationNeeded) persist(loaded);
            replaceInMemory(loaded);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot load transaction file: " + storageFile, exception);
        }
    }

    /**
     * Returns copies of all stored transactions.
     *
     * @return a list of saved transactions
     */
    public synchronized ArrayList<Transaction> getTransactions() {
        ArrayList<Transaction> copy = new ArrayList<>();
        for (Transaction transaction : transactions) copy.add(copy(transaction));
        return copy;
    }

    private int findIndex(UUID id) {
        for (int index = 0; index < transactions.size(); index++) {
            if (transactions.get(index).getId().equals(id)) return index;
        }
        return -1;
    }

    private void replaceInMemory(List<Transaction> next) {
        transactions.clear();
        for (Transaction transaction : next) transactions.add(copy(transaction));
    }

    // save the data

    private void persist(List<Transaction> next) {
        Path parent = storageFile.toAbsolutePath().getParent();
        Path temporary = null;
        try {
            if (parent != null) Files.createDirectories(parent);
            temporary = Files.createTempFile(parent, storageFile.getFileName().toString(), ".tmp");
            List<String> lines = new ArrayList<>();
            for (Transaction transaction : next) lines.add(serialize(transaction));
            Files.write(temporary, lines, StandardCharsets.UTF_8);
            try {
                Files.move(temporary, storageFile, StandardCopyOption.ATOMIC_MOVE,
                        StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException exception) {
                Files.move(temporary, storageFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Transaction file could not be saved.", exception);
        } finally {
            if (temporary != null) {
                try { Files.deleteIfExists(temporary); } catch (IOException ignored) { }
            }
        }
    }

    private static String serialize(Transaction transaction) {
        return transaction.getId() + "|" + transaction.getDate() + "|" + transaction.getTime() + "|" +
                escape(transaction.getDescription()) + "|" + escape(transaction.getVendor()) + "|" +
                transaction.getAmount();
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\").replace("|", "\\|")
                .replace("\r", "\\r").replace("\n", "\\n");
    }

    private static String[] parseRecord(String line) {
        ArrayList<String> escapedFields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean escaped = false;
        for (int index = 0; index < line.length(); index++) {
            char character = line.charAt(index);
            if (escaped) {
                field.append(switch (character) {
                    case 'n' -> '\n';
                    case 'r' -> '\r';
                    default -> character;
                });
                escaped = false;
            } else if (character == '\\') {
                escaped = true;
            } else if (character == '|') {
                escapedFields.add(field.toString());
                field.setLength(0);
            } else {
                field.append(character);
            }
        }
        if (escaped) field.append('\\');
        escapedFields.add(field.toString());
        if (escapedFields.size() == 6) return escapedFields.toArray(String[]::new);

        // Legacy records used unescaped pipes and exactly five fields.
        return line.split("\\|", -1);
    }

    private static Transaction copyWithId(Transaction transaction, UUID id) {
        return new Transaction(id, transaction.getDate(), transaction.getTime(),
                transaction.getDescription(), transaction.getVendor(), transaction.getAmount());
    }

    private static Transaction copy(Transaction transaction) {
        return copyWithId(transaction, transaction.getId());
    }
}
