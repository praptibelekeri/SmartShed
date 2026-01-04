#include <stdio.h>
#include <string.h>

#define MAX 10
#define MAX_FRAMES 10
#define MAX_REF 50

typedef struct {
    char pid[5];
    int burst, priority, frames;
    int ref[MAX_REF], ref_len;
    int faults, waiting, turnaround;
    float fault_rate;
    char scheduler[15];
} Process;

Process p[MAX];

int findLRU(int time[], int n) {
    int min = time[0], pos = 0;
    for (int i = 1; i < n; i++)
        if (time[i] < min) { min = time[i]; pos = i; }
    return pos;
}

int simulateLRU(int frames, int ref[], int n) {
    int frame[MAX_FRAMES], time[MAX_FRAMES];
    int faults = 0, counter = 0;

    for (int i = 0; i < frames; i++) frame[i] = -1;

    for (int i = 0; i < n; i++) {
        int found = 0;
        for (int j = 0; j < frames; j++) {
            if (frame[j] == ref[i]) {
                found = 1;
                time[j] = ++counter;
                break;
            }
        }
        if (!found) {
            int pos = -1;
            for (int j = 0; j < frames; j++)
                if (frame[j] == -1) { pos = j; break; }
            if (pos == -1) pos = findLRU(time, frames);
            frame[pos] = ref[i];
            time[pos] = ++counter;
            faults++;
        }
    }
    return faults;
}

void decideScheduler(Process *pr) {
    float sjf = (1.0 / pr->burst) + pr->fault_rate;
    float rr = pr->burst + pr->waiting - pr->fault_rate;
    float prio = pr->priority + (pr->fault_rate / pr->burst);

    if (sjf >= rr && sjf >= prio) strcpy(pr->scheduler, "SJF");
    else if (rr >= sjf && rr >= prio) strcpy(pr->scheduler, "ROUND_ROBIN");
    else strcpy(pr->scheduler, "PRIORITY");
}

int main() {
    FILE *fin = fopen("input.txt", "r");
    if (!fin) return 1;

    int n;
    fscanf(fin, "%d", &n);

    for (int i = 0; i < n; i++) {
        fscanf(fin, "%s %d %d %d %d",
               p[i].pid, &p[i].burst, &p[i].priority,
               &p[i].frames, &p[i].ref_len);
        for (int j = 0; j < p[i].ref_len; j++)
            fscanf(fin, "%d", &p[i].ref[j]);
    }
    fclose(fin);

    int time = 0, busy = 0;

    for (int i = 0; i < n; i++) {
        p[i].faults = simulateLRU(p[i].frames, p[i].ref, p[i].ref_len);
        p[i].fault_rate = (float)p[i].faults / p[i].ref_len;
        p[i].waiting = time;
        time += p[i].burst;
        p[i].turnaround = time;
        decideScheduler(&p[i]);
        busy += p[i].burst;
    }

    FILE *fout = fopen("output.txt", "w");
    fprintf(fout, "PID Burst Waiting Turnaround Faults Scheduler\n");
    for (int i = 0; i < n; i++)
        fprintf(fout, "%s %d %d %d %d %s\n",
                p[i].pid, p[i].burst, p[i].waiting,
                p[i].turnaround, p[i].faults, p[i].scheduler);
    fprintf(fout, "CPU_UTIL %.2f\n", (busy * 100.0) / time);
    fclose(fout);

    return 0;
}
